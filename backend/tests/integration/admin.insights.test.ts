import request from "supertest";
import { sql } from "drizzle-orm";
import app from "../../src/app.js";
import { signAdminToken } from "../../src/utils/adminJwt.js";
import { signToken } from "../../src/utils/jwt.js";
import { resetAll, createUser, createSport, closeTestDb, testDb } from "../helpers/db.js";

const adminToken = () => signAdminToken();

const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

let creator: { userId: string; token: string };
let joiner: { userId: string; token: string };
let pending: { userId: string; token: string };
let activityId: string;

async function createActivity(token: string, sportId: string, startDate: string, city = "Perpignan") {
  const res = await request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Sortie admin", city, startDate, levelRequired: "BEGINNER", maxParticipants: 4, sportId });
  expect(res.status).toBe(201);
  return res.body.activity.id as string;
}

beforeAll(async () => {
  await resetAll();
  const sportId = await createSport("Escalade");
  creator = await createUser({ pseudo: "organisatrice" });
  joiner = await createUser({ pseudo: "participant" });
  pending = await createUser({ pseudo: "en-attente" });

  activityId = await createActivity(creator.token, sportId, inDays(5));
  await createActivity(creator.token, sportId, inDays(9), "Collioure");

  // joiner accepté, pending laissé en attente.
  for (const user of [joiner, pending]) {
    const res = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${user.token}`);
    expect([200, 201]).toContain(res.status);
  }
  const [row] = (
    await testDb.execute(
      sql`select id from participations where user_id = ${joiner.userId} and activity_id = ${activityId}`
    )
  ).rows as { id: string }[];
  await testDb.execute(sql`update participations set status = 'ACCEPTED' where id = ${row!.id}`);
  await testDb.execute(
    sql`insert into sport_favorites (user_id, sport_id) values (${joiner.userId}, ${sportId})`
  );
});

afterAll(async () => {
  await resetAll();
  await closeTestDb();
});

describe("Accès admin", () => {
  it.each([
    "/api/admin/stats/insights",
    "/api/admin/users/00000000-0000-4000-8000-000000000000",
    "/api/admin/activities/00000000-0000-4000-8000-000000000000",
  ])("refuse %s sans jeton admin, y compris avec un jeton utilisateur", async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
    const userRes = await request(app).get(path).set("Authorization", `Bearer ${signToken({ id: creator.userId })}`);
    expect(userRes.status).toBe(401);
  });
});

describe("GET /api/admin/stats/insights", () => {
  it("renvoie les totaux, répartitions et classements", async () => {
    const res = await request(app).get("/api/admin/stats/insights").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const { insights } = res.body;

    expect(insights.totals).toMatchObject({ users: 3, activities: 2, participations: 2, favorites: 1 });
    expect(insights.engagement).toMatchObject({ activeUsers: 3, usersWithFavorites: 1 });
    expect(insights.activities).toMatchObject({ upcoming: 2, past: 0 });
    expect(insights.activities.byLevel).toEqual({ BEGINNER: 2 });
    expect(insights.participationsByStatus).toEqual({ ACCEPTED: 1, PENDING: 1 });
    // 1 accepté sur 4 places pour l'une, 0 pour l'autre : moyenne 12,5 % -> 13.
    expect(insights.activities.fillRatePct).toBe(13);
    expect(insights.topSports).toEqual([{ name: "Escalade", count: 2 }]);
    expect(insights.favoriteSports).toEqual([{ name: "Escalade", count: 1 }]);
    expect(insights.activityCities).toEqual([
      { name: "Collioure", count: 1 },
      { name: "Perpignan", count: 1 },
    ]);
    expect(insights.signupMethods).toEqual([{ name: "email", count: 3 }]);
    expect(insights.topOrganizers[0]).toMatchObject({ pseudo: "organisatrice", count: 2 });
    expect(insights.topParticipants).toEqual([expect.objectContaining({ pseudo: "participant", count: 1 })]);
  });

  it("filtre par territoire et rejette un territoire inconnu", async () => {
    const ok = await request(app)
      .get("/api/admin/stats/insights?territory=66")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(ok.status).toBe(200);
    expect(ok.body.insights.totals.activities).toBe(2);

    const unknown = await request(app)
      .get("/api/admin/stats/insights?territory=ZZ")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(unknown.status).toBe(404);
  });
});

describe("Listes admin enrichies", () => {
  it("ajoute email, compteurs et territoire principal aux utilisateurs", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const organizer = res.body.users.find((u: { id: string }) => u.id === creator.userId);
    expect(organizer).toMatchObject({
      activitiesCreated: 2,
      participations: 0,
      defaultTerritory: "66",
      providers: [],
    });
    expect(organizer.email).toContain("@");
  });

  it("ajoute statut, participants et territoire aux activités", async () => {
    const res = await request(app).get("/api/admin/activities").set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const activity = res.body.activities.find((a: { id: string }) => a.id === activityId);
    expect(activity).toMatchObject({
      participantsCount: 1,
      pendingCount: 1,
      maxParticipants: 4,
      territoryCode: "66",
      creatorId: creator.userId,
    });
  });
});

describe("Fiches détaillées", () => {
  it("GET /api/admin/users/:userId renvoie le profil complet et l'historique", async () => {
    const res = await request(app)
      .get(`/api/admin/users/${joiner.userId}`)
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const { user } = res.body;
    expect(user).toMatchObject({ pseudo: "participant", hasPassword: true, favoriteSports: ["Escalade"] });
    expect(user.counts).toMatchObject({ participations: 1, participationsAccepted: 1, activitiesCreated: 0 });
    expect(user.participations[0]).toMatchObject({ activityId, status: "ACCEPTED" });
    expect(user.territories[0]).toMatchObject({ code: "66", isDefault: true });
    // Jamais de mot de passe ni de hash exposé.
    expect(JSON.stringify(user)).not.toContain("placeholder_hash");
  });

  it("GET /api/admin/activities/:activityId renvoie participants et compteurs", async () => {
    const res = await request(app)
      .get(`/api/admin/activities/${activityId}`)
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    const { activity } = res.body;
    expect(activity.creator).toMatchObject({ id: creator.userId, pseudo: "organisatrice" });
    expect(activity.counts).toMatchObject({ accepted: 1, pending: 1, refused: 0 });
    expect(activity.participants.map((p: { status: string }) => p.status)).toEqual(["ACCEPTED", "PENDING"]);
    expect(activity.territory.code).toBe("66");
    expect(new Date(activity.startDate).getTime()).toBeGreaterThan(Date.now());
  });

  it("renvoie 404 pour un identifiant inconnu et 400 pour un identifiant invalide", async () => {
    const missing = await request(app)
      .get("/api/admin/activities/00000000-0000-4000-8000-000000000000")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(missing.status).toBe(404);

    const invalid = await request(app)
      .get("/api/admin/users/pas-un-uuid")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(invalid.status).toBe(400);
  });
});
