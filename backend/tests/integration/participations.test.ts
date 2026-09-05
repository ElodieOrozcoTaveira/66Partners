import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import {
  resetAll,
  createUser,
  createSport,
  createTerritory,
  attachUserToTerritory,
  closeTestDb,
} from "../helpers/db.js";

let creatorToken: string;
let joinerToken: string;
let creatorId: string;
let joinerId: string;
let activityId: string;

const futureDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

async function createActivity(token: string, sportId: string): Promise<string> {
  const res = await request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Activité test",
      city: "Perpignan",
      startDate: futureDate(),
      levelRequired: "BEGINNER",
      maxParticipants: 3,
      sportId,
    });
  return res.body.activity.id as string;
}

beforeEach(async () => {
  await resetAll();
  ({ userId: creatorId, token: creatorToken } = await createUser({
    email: "creator@test.com",
  }));
  ({ userId: joinerId, token: joinerToken } = await createUser({
    email: "joiner@test.com",
  }));
  const sportId = await createSport("Football");
  activityId = await createActivity(creatorToken, sportId);
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/activities/:id/join", () => {
  it("un utilisateur peut demander à rejoindre une activité", async () => {
    const res = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.participation.status).toBe("PENDING");
    expect(res.body.participation.activityId).toBe(activityId);
  });

  it("refuse si l'utilisateur essaie de rejoindre sa propre activité", async () => {
    const res = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("CANNOT_JOIN_OWN_ACTIVITY");
  });

  it("refuse une demande en double", async () => {
    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);

    const res = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ALREADY_REQUESTED");
  });

  it("renvoie 404 pour une activité inexistante", async () => {
    const res = await request(app)
      .post(`/api/activities/${randomUUID()}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).post(
      `/api/activities/${activityId}/join`
    );
    expect(res.status).toBe(401);
  });

  it("refuse (403) si le demandeur n'est pas membre du territoire de l'activité", async () => {
    const territory34 = await createTerritory({ code: "34" });
    const { userId: creator34Id, token: creator34Token } = await createUser({
      email: "creator34join@test.com",
    });
    await attachUserToTerritory(creator34Id, territory34.id);

    const sportId2 = await createSport("Rugby");
    const activity34Res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creator34Token}`)
      .send({
        title: "Activité 34",
        city: "Montpellier",
        startDate: futureDate(),
        levelRequired: "BEGINNER",
        maxParticipants: 3,
        sportId: sportId2,
        territoryId: territory34.id,
      });
    const activity34Id = activity34Res.body.activity.id as string;

    const res = await request(app)
      .post(`/api/activities/${activity34Id}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("NOT_TERRITORY_MEMBER");
  });
});

describe("PUT /api/participations/:id/accept", () => {
  let participationId: string;

  beforeEach(async () => {
    const joinRes = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);
    participationId = joinRes.body.participation.id as string;
  });

  it("le créateur accepte une demande de participation", async () => {
    const res = await request(app)
      .put(`/api/participations/${participationId}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.participation.status).toBe("ACCEPTED");
  });

  it("refuse l'acceptation par un non-créateur", async () => {
    const res = await request(app)
      .put(`/api/participations/${participationId}/accept`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("renvoie 404 pour une participation inexistante", async () => {
    const res = await request(app)
      .put(`/api/participations/${randomUUID()}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("PARTICIPATION_NOT_FOUND");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).put(
      `/api/participations/${participationId}/accept`
    );
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/participations/:id/refuse", () => {
  let participationId: string;

  beforeEach(async () => {
    const joinRes = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);
    participationId = joinRes.body.participation.id as string;
  });

  it("le créateur refuse une demande de participation", async () => {
    const res = await request(app)
      .put(`/api/participations/${participationId}/refuse`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.participation.status).toBe("REFUSED");
  });

  it("refuse le refus par un non-créateur", async () => {
    const res = await request(app)
      .put(`/api/participations/${participationId}/refuse`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("renvoie 404 pour une participation inexistante", async () => {
    const res = await request(app)
      .put(`/api/participations/${randomUUID()}/refuse`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(404);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).put(
      `/api/participations/${participationId}/refuse`
    );
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/participations/:id", () => {
  let participationId: string;

  beforeEach(async () => {
    const joinRes = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);
    participationId = joinRes.body.participation.id as string;
  });

  it("le participant annule sa demande", async () => {
    const res = await request(app)
      .delete(`/api/participations/${participationId}`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse l'annulation par un autre utilisateur", async () => {
    const res = await request(app)
      .delete(`/api/participations/${participationId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("renvoie 404 pour une participation inexistante", async () => {
    const res = await request(app)
      .delete(`/api/participations/${randomUUID()}`)
      .set("Authorization", `Bearer ${joinerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("PARTICIPATION_NOT_FOUND");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete(
      `/api/participations/${participationId}`
    );
    expect(res.status).toBe(401);
  });
});

describe("Limite de participants (ACTIVITY_FULL)", () => {
  it("refuse une acceptation si l'activité est pleine", async () => {
    const sportId2 = await createSport("Padel");
    const smallActivity = await createActivity(creatorToken, sportId2);

    const { token: j1 } = await createUser({ email: "j1@test.com" });
    const { token: j2 } = await createUser({ email: "j2@test.com" });
    const { token: j3 } = await createUser({ email: "j3@test.com" });

    const join1 = await request(app)
      .post(`/api/activities/${smallActivity}/join`)
      .set("Authorization", `Bearer ${j1}`);
    const join2 = await request(app)
      .post(`/api/activities/${smallActivity}/join`)
      .set("Authorization", `Bearer ${j2}`);
    const join3 = await request(app)
      .post(`/api/activities/${smallActivity}/join`)
      .set("Authorization", `Bearer ${j3}`);

    const p1 = join1.body.participation.id as string;
    const p2 = join2.body.participation.id as string;
    const p3 = join3.body.participation.id as string;

    // Accepter les 3 premiers (maxParticipants = 3)
    await request(app)
      .put(`/api/participations/${p1}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);
    await request(app)
      .put(`/api/participations/${p2}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);
    await request(app)
      .put(`/api/participations/${p3}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    // Un 4ème participant tente de rejoindre
    const { token: j4 } = await createUser({ email: "j4@test.com" });
    const join4 = await request(app)
      .post(`/api/activities/${smallActivity}/join`)
      .set("Authorization", `Bearer ${j4}`);
    const p4 = join4.body.participation.id as string;

    const res = await request(app)
      .put(`/api/participations/${p4}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("ACTIVITY_FULL");
  });
});
