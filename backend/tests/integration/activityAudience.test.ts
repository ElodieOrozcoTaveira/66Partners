import request from "supertest";
import app from "../../src/app.js";
import { closeTestDb, createSport, createUser, resetAll } from "../helpers/db.js";

type Gender = "FEMALE" | "MALE" | null;

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

let sportId: string;

async function member(email: string, gender: Gender) {
  const user = await createUser({ email });
  if (gender) {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ gender });
    expect(res.status).toBe(200);
  }
  return user;
}

function createActivity(token: string, audience?: "ALL" | "WOMEN" | "MEN") {
  return request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Sortie VTT",
      city: "Perpignan",
      startDate: futureDate(),
      levelRequired: "BEGINNER",
      maxParticipants: 4,
      sportId,
      ...(audience ? { audience } : {}),
    });
}

function join(token: string, activityId: string) {
  return request(app).post(`/api/activities/${activityId}/join`).set("Authorization", `Bearer ${token}`);
}

beforeEach(async () => {
  await resetAll();
  sportId = await createSport("VTT");
});

afterAll(async () => {
  await closeTestDb();
});

describe("Genre déclaré (profil)", () => {
  it("se renseigne, se retire, et n'apparaît que dans son propre profil", async () => {
    const alice = await member("alice@test.com", "FEMALE");
    const bob = await member("bob@test.com", null);

    const me = await request(app).get("/api/users/me").set("Authorization", `Bearer ${alice.token}`);
    expect(me.body.user.gender).toBe("FEMALE");

    const seenByOther = await request(app)
      .get(`/api/users/${alice.userId}`)
      .set("Authorization", `Bearer ${bob.token}`);
    expect(seenByOther.status).toBe(200);
    expect(seenByOther.body.user).not.toHaveProperty("gender");

    // "Je préfère ne pas préciser" = null.
    const cleared = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${alice.token}`)
      .send({ gender: null });
    expect(cleared.body.user.gender).toBeNull();
  });

  it("refuse une valeur inconnue", async () => {
    const user = await member("x@test.com", null);
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ gender: "OTHER" });
    expect(res.status).toBe(400);
  });
});

describe("Création d'une activité réservée", () => {
  it("ouverte à tous par défaut, sans genre requis", async () => {
    const user = await member("tous@test.com", null);
    const res = await createActivity(user.token);
    expect(res.status).toBe(201);
    expect(res.body.activity.audience).toBe("ALL");
  });

  it("entre femmes : réservée à une organisatrice qui a déclaré être une femme", async () => {
    const noGender = await member("sans@test.com", null);
    const man = await member("homme@test.com", "MALE");
    const woman = await member("femme@test.com", "FEMALE");

    const refusedMissing = await createActivity(noGender.token, "WOMEN");
    expect(refusedMissing.status).toBe(403);
    expect(refusedMissing.body.code).toBe("GENDER_REQUIRED");

    const refusedMan = await createActivity(man.token, "WOMEN");
    expect(refusedMan.status).toBe(403);
    expect(refusedMan.body.code).toBe("AUDIENCE_RESTRICTED");

    const ok = await createActivity(woman.token, "WOMEN");
    expect(ok.status).toBe(201);
    expect(ok.body.activity.audience).toBe("WOMEN");
  });
});

describe("Demande de participation à une activité réservée", () => {
  it("contrôle serveur : genre manquant, genre différent, genre correspondant", async () => {
    const organizer = await member("orga@test.com", "FEMALE");
    const activityId = (await createActivity(organizer.token, "WOMEN")).body.activity.id as string;

    const noGender = await member("sans@test.com", null);
    const missing = await join(noGender.token, activityId);
    expect(missing.status).toBe(403);
    expect(missing.body.code).toBe("GENDER_REQUIRED");

    const man = await member("homme@test.com", "MALE");
    const refused = await join(man.token, activityId);
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe("AUDIENCE_RESTRICTED");

    const woman = await member("femme@test.com", "FEMALE");
    const accepted = await join(woman.token, activityId);
    expect(accepted.status).toBe(201);
    expect(accepted.body.participation.status).toBe("PENDING");
  });

  it("entre hommes : symétrique", async () => {
    const organizer = await member("orga-h@test.com", "MALE");
    const activityId = (await createActivity(organizer.token, "MEN")).body.activity.id as string;
    const woman = await member("femme2@test.com", "FEMALE");
    expect((await join(woman.token, activityId)).body.code).toBe("AUDIENCE_RESTRICTED");
    const man = await member("homme2@test.com", "MALE");
    expect((await join(man.token, activityId)).status).toBe(201);
  });
});

describe("Modification du public", () => {
  it("restreindre est refusé dès qu'un participant est accepté ; revenir à tous reste possible", async () => {
    const organizer = await member("orga@test.com", "FEMALE");
    const activityId = (await createActivity(organizer.token)).body.activity.id as string;
    const guest = await member("invite@test.com", null);
    const participationId = (await join(guest.token, activityId)).body.participation.id as string;
    await request(app)
      .put(`/api/participations/${participationId}/accept`)
      .set("Authorization", `Bearer ${organizer.token}`);

    const restrict = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ audience: "WOMEN" });
    expect(restrict.status).toBe(409);
    expect(restrict.body.code).toBe("AUDIENCE_LOCKED");

    const backToAll = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ audience: "ALL", title: "Sortie VTT (ouverte)" });
    expect(backToAll.status).toBe(200);
  });

  it("restreindre sans participant accepté : autorisé si l'organisatrice correspond", async () => {
    const organizer = await member("orga2@test.com", "FEMALE");
    const activityId = (await createActivity(organizer.token)).body.activity.id as string;
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${organizer.token}`)
      .send({ audience: "WOMEN" });
    expect(res.status).toBe(200);
    expect(res.body.activity.audience).toBe("WOMEN");
  });
});

describe("Liste des activités", () => {
  it("expose le public et filtre par public", async () => {
    const woman = await member("femme@test.com", "FEMALE");
    await createActivity(woman.token, "WOMEN");
    await createActivity(woman.token);

    const all = await request(app)
      .get("/api/activities?territory=66")
      .set("Authorization", `Bearer ${woman.token}`);
    expect(all.status).toBe(200);
    expect(all.body.activities.map((a: { audience: string }) => a.audience).sort()).toEqual(["ALL", "WOMEN"]);

    const women = await request(app)
      .get("/api/activities?territory=66&audience=WOMEN")
      .set("Authorization", `Bearer ${woman.token}`);
    expect(women.body.activities).toHaveLength(1);
    expect(women.body.activities[0].audience).toBe("WOMEN");
  });
});
