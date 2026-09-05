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

let token: string;
let otherToken: string;
let sportId: string;

const futureDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

function validActivity(overrides: Record<string, unknown> = {}) {
  return {
    title: "Sortie running",
    city: "Perpignan",
    startDate: futureDate(),
    levelRequired: "BEGINNER",
    maxParticipants: 5,
    sportId,
    ...overrides,
  };
}

beforeEach(async () => {
  await resetAll();
  ({ token } = await createUser({ email: "creator@test.com" }));
  ({ token: otherToken } = await createUser({ email: "other@test.com" }));
  sportId = await createSport("Running");
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/activities", () => {
  it("crée une activité (authentifié)", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    expect(res.status).toBe(201);
    expect(res.body.activity.title).toBe("Sortie running");
    expect(res.body.activity.sportId).toBe(sportId);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .post("/api/activities")
      .send(validActivity());
    expect(res.status).toBe(401);
  });

  it("refuse un sportId inexistant", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ sportId: randomUUID() }));

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });

  it("refuse une date dans le passé", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ startDate: "2020-01-01T00:00:00.000Z" }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse un titre manquant", async () => {
    const { title, ...body } = validActivity();
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse maxParticipants ≤ 1", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ maxParticipants: 1 }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/activities", () => {
  it("renvoie une liste vide", async () => {
    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(200);
    expect(res.body.activities).toEqual([]);
  });

  it("renvoie les activités créées", async () => {
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
  });

  it("filtre par ville", async () => {
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ city: "Perpignan" }));

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ city: "Canet" }));

    const res = await request(app).get(
      "/api/activities?city=Perpignan"
    );
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].city).toBe("Perpignan");
  });

  it("filtre par sportId", async () => {
    const otherSportId = await createSport("Natation");

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ sportId: otherSportId }));

    const res = await request(app).get(
      `/api/activities?sportId=${sportId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
  });
});

describe("GET /api/activities/:id", () => {
  it("renvoie une activité par son ID", async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    const activityId = createRes.body.activity.id as string;

    const res = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.activity.id).toBe(activityId);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .get(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("renvoie 400 pour un UUID invalide", async () => {
    const res = await request(app)
      .get("/api/activities/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse sans authentification", async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    const activityId = createRes.body.activity.id as string;

    const res = await request(app).get(`/api/activities/${activityId}`);
    expect(res.status).toBe(401);
  });

  it("renvoie 404 (jamais 403) pour un utilisateur qui n'est pas membre du territoire de l'activité", async () => {
    // Le créateur est rattaché au territoire "34" en plus du 66 par défaut,
    // et y crée explicitement son activité. L'outsider ne rejoint jamais
    // "34" — il ne reste membre que du 66, comme tout compte fraîchement créé.
    const { userId: creatorId, token: creator34Token } = await createUser({
      email: "creator34@test.com",
    });
    const territory34 = await createTerritory({ code: "34" });
    await attachUserToTerritory(creatorId, territory34.id);

    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creator34Token}`)
      .send(validActivity({ territoryId: territory34.id }));
    const activityId = createRes.body.activity.id as string;
    expect(createRes.body.activity.territoryId).toBe(territory34.id);

    const { token: outsiderToken } = await createUser({ email: "outsider34@test.com" });

    const outsiderRes = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(outsiderRes.status).toBe(404);
    expect(outsiderRes.body.code).toBe("ACTIVITY_NOT_FOUND");

    const ownerRes = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${creator34Token}`);
    expect(ownerRes.status).toBe(200);
  });
});

describe("PATCH /api/activities/:id", () => {
  let activityId: string;

  beforeEach(async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    activityId = createRes.body.activity.id as string;
  });

  it("le créateur peut modifier son activité", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Running modifié" });

    expect(res.status).toBe(200);
    expect(res.body.activity.title).toBe("Running modifié");
  });

  it("refuse la modification par un autre utilisateur", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Tentative de hack" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .send({ title: "X" });
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .patch(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "X" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });
});

describe("DELETE /api/activities/:id", () => {
  let activityId: string;

  beforeEach(async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    activityId = createRes.body.activity.id as string;
  });

  it("le créateur peut supprimer son activité", async () => {
    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse la suppression par un autre utilisateur", async () => {
    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete(`/api/activities/${activityId}`);
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .delete(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });
});
