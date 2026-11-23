import { afterEach, beforeEach, afterAll, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import { sql } from "drizzle-orm";
import app from "../../src/app.js";
import { ageFromBirthDate } from "../../src/services/discovery.services.js";
import { closeTestDb, createSport, createUser, resetAll, testDb } from "../helpers/db.js";

const COMMUNES: Record<string, { nom: string; centre: { coordinates: [number, number] } }> = {
  "66136": { nom: "Perpignan", centre: { coordinates: [2.8956, 42.6986] } },
  "66037": { nom: "Canet-en-Roussillon", centre: { coordinates: [3.0079, 42.7053] } },
  "11069": { nom: "Carcassonne", centre: { coordinates: [2.3491, 43.213] } },
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

function show(token: string, inseeCode: string, showAge = false) {
  return request(app).put("/api/discovery/me").set(auth(token)).send({ inseeCode, showAge, consent: true });
}

function list(token: string) {
  return request(app).get("/api/discovery/members").set(auth(token));
}

beforeEach(async () => {
  await resetAll();
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const code = String(input).split("/communes/")[1]?.split("?")[0] ?? "";
    const commune = COMMUNES[code];
    return commune
      ? new Response(JSON.stringify(commune), { status: 200 })
      : new Response("{}", { status: 404 });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Sportifs autour de toi", () => {
  it("exige d'être connecté", async () => {
    expect((await request(app).get("/api/discovery/members")).status).toBe(401);
    expect((await request(app).get("/api/discovery/me")).status).toBe(401);
  });

  it("est désactivé par défaut et ne montre la carte qu'aux membres visibles", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const other = await createUser({ email: "autre@test.com" });
    await show(other.token, "66037");

    const visibility = await request(app).get("/api/discovery/me").set(auth(me.token));
    expect(visibility.body.visibility).toBeNull();

    const res = await list(me.token);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("MAP_VISIBILITY_REQUIRED");
  });

  it("exige un consentement explicite et un email confirmé", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const noConsent = await request(app)
      .put("/api/discovery/me")
      .set(auth(me.token))
      .send({ inseeCode: "66136", consent: false });
    expect(noConsent.status).toBe(400);

    const unverified = await createUser({ email: "nv@test.com", emailVerified: false });
    const res = await show(unverified.token, "66136");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("refuse une commune inconnue, sans exposer d'erreur interne", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const res = await show(me.token, "99999");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("COMMUNE_NOT_FOUND");
  });

  it("n'enregistre que le centre officiel de la commune choisie", async () => {
    const me = await createUser({ email: "moi@test.com" });
    await show(me.token, "66136");
    const rows = await testDb.execute(
      sql`select latitude, longitude from user_map_profiles where user_id = ${me.userId}`
    );
    expect(rows.rows[0]).toEqual({ latitude: 42.6986, longitude: 2.8956 });
  });

  it("liste les membres dans le rayon, sans soi-même ni données privées", async () => {
    const sportId = await createSport("Running");
    const me = await createUser({ email: "moi@test.com" });
    const near = await createUser({ email: "proche@test.com", pseudo: "Camille" });
    const far = await createUser({ email: "loin@test.com" });
    await testDb.execute(sql`update users set birth_date = '1990-01-01', gender = 'FEMALE', looking_for = 'Courir en semaine' where id = ${near.userId}`);
    await testDb.execute(sql`insert into user_sports (user_id, sport_id, level) values (${near.userId}, ${sportId}, 'INTERMEDIATE')`);
    await show(me.token, "66136");
    await show(near.token, "66037");
    await show(far.token, "11069");

    const res = await list(me.token);
    expect(res.status).toBe(200);
    expect(res.body.radiusKm).toBe(50);
    expect(res.body.members).toHaveLength(1);
    const member = res.body.members[0];
    expect(member).toMatchObject({
      id: near.userId,
      pseudo: "Camille",
      age: null,
      sectorName: "Canet-en-Roussillon",
      lookingFor: "Courir en semaine",
      sports: [{ id: sportId, name: "Running", level: "INTERMEDIATE" }],
    });
    expect(Object.keys(member).sort()).toEqual(
      ["age", "avatar", "id", "latitude", "longitude", "lookingFor", "pseudo", "sectorName", "sports"].sort()
    );
    expect(Math.abs(member.latitude - 42.7053)).toBeLessThanOrEqual(0.021);
    expect(Math.abs(member.longitude - 3.0079)).toBeLessThanOrEqual(0.021);
    expect(member.latitude).not.toBe(42.7053);
  });

  it("n'affiche l'âge que si le membre l'a choisi", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const near = await createUser({ email: "proche@test.com" });
    await testDb.execute(sql`update users set birth_date = '1990-01-01' where id = ${near.userId}`);
    await show(me.token, "66136");
    await show(near.token, "66037", true);

    const res = await list(me.token);
    expect(res.body.members[0].age).toBe(ageFromBirthDate("1990-01-01"));
    expect(res.body.members[0].birthDate).toBeUndefined();
  });

  it("masque les membres bloqués, dans les deux sens", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const blocked = await createUser({ email: "bloque@test.com" });
    await show(me.token, "66136");
    await show(blocked.token, "66037");
    await request(app).post(`/api/users/${blocked.userId}/block`).set(auth(me.token));

    expect((await list(me.token)).body.members).toHaveLength(0);
    expect((await list(blocked.token)).body.members).toHaveLength(0);
  });

  it("retire le membre de la carte et efface son secteur", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const near = await createUser({ email: "proche@test.com" });
    await show(me.token, "66136");
    await show(near.token, "66037");

    const res = await request(app).delete("/api/discovery/me").set(auth(near.token));
    expect(res.status).toBe(204);
    expect((await list(me.token)).body.members).toHaveLength(0);
    const rows = await testDb.execute(sql`select 1 from user_map_profiles where user_id = ${near.userId}`);
    expect(rows.rows).toHaveLength(0);
  });

  it("ne dépend jamais de la position du compteur « autour de moi »", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const located = await createUser({ email: "gps@test.com" });
    await show(me.token, "66136");
    await request(app)
      .post("/api/nearby")
      .set(auth(located.token))
      .send({ latitude: 42.7, longitude: 2.9 });

    expect((await list(me.token)).body.members).toHaveLength(0);
  });

  describe("détail d'un membre", () => {
    const detail = (token: string, id: string) =>
      request(app).get(`/api/discovery/members/${id}`).set(auth(token));

    async function createActivity(token: string, sportId: string, title: string, startDate: Date) {
      const res = await request(app).post("/api/activities").set(auth(token)).send({
        sportId,
        title,
        city: "Canet-en-Roussillon",
        startDate: startDate.toISOString(),
        levelRequired: "BEGINNER",
        maxParticipants: 4,
      });
      expect(res.status).toBe(201);
      return res.body.activity.id as string;
    }

    it("exige que le visiteur soit lui-même sur la carte", async () => {
      const me = await createUser({ email: "moi@test.com" });
      const near = await createUser({ email: "proche@test.com" });
      await show(near.token, "66037");
      const res = await detail(me.token, near.userId);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("MAP_VISIBILITY_REQUIRED");
    });

    it("renvoie le secteur et seulement les activités à venir qu'il organise", async () => {
      const sportId = await createSport("Running");
      const me = await createUser({ email: "moi@test.com" });
      const near = await createUser({ email: "proche@test.com" });
      await show(me.token, "66136");
      await show(near.token, "66037");
      const upcoming = await createActivity(near.token, sportId, "Footing", new Date(Date.now() + 86_400_000));
      await createActivity(me.token, sportId, "La mienne", new Date(Date.now() + 86_400_000));

      const res = await detail(me.token, near.userId);
      expect(res.status).toBe(200);
      expect(res.body.member.sectorName).toBe("Canet-en-Roussillon");
      expect(res.body.upcomingActivities.map((activity: { id: string }) => activity.id)).toEqual([upcoming]);
      expect(res.body.upcomingActivities[0].creatorId).toBeUndefined();
    });

    it("répond 404 pour un membre invisible, bloqué ou hors du rayon", async () => {
      const me = await createUser({ email: "moi@test.com" });
      const hidden = await createUser({ email: "cache@test.com" });
      const blocked = await createUser({ email: "bloque@test.com" });
      const far = await createUser({ email: "loin@test.com" });
      await show(me.token, "66136");
      await show(blocked.token, "66037");
      await show(far.token, "11069");
      await request(app).post(`/api/users/${blocked.userId}/block`).set(auth(me.token));

      expect((await detail(me.token, hidden.userId)).status).toBe(404);
      expect((await detail(me.token, blocked.userId)).status).toBe(404);
      expect((await detail(me.token, far.userId)).status).toBe(404);
    });
  });

  it("calcule l'âge correctement", () => {
    expect(ageFromBirthDate("2000-06-15", new Date("2026-06-14T12:00:00Z"))).toBe(25);
    expect(ageFromBirthDate("2000-06-15", new Date("2026-06-15T12:00:00Z"))).toBe(26);
    expect(ageFromBirthDate(null)).toBeNull();
  });
});
