import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import { resetAll, resetSports, createUser, closeTestDb } from "../helpers/db.js";

let token: string;

beforeAll(async () => {
  await resetAll();
  ({ token } = await createUser({ email: "sports@test.com" }));
});

beforeEach(async () => {
  // Tronque uniquement les sports (pas les users — le token doit rester valide)
  const { resetSports } = await import("../helpers/db.js");
  await resetSports();
});

afterAll(async () => {
  await closeTestDb();
});

describe("GET /api/sports", () => {
  it("renvoie une liste vide quand il n'y a pas de sports", async () => {
    const res = await request(app).get("/api/sports");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sports).toEqual([]);
  });

  it("renvoie la liste des sports existants", async () => {
    await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Football" });

    const res = await request(app).get("/api/sports");
    expect(res.status).toBe(200);
    expect(res.body.sports).toHaveLength(1);
    expect(res.body.sports[0].name).toBe("Football");
  });
});

describe("GET /api/sports/:id", () => {
  it("renvoie un sport par son ID", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Tennis" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app).get(`/api/sports/${sportId}`);
    expect(res.status).toBe(200);
    expect(res.body.sport.name).toBe("Tennis");
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app).get(`/api/sports/${randomUUID()}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });

  it("renvoie 400 pour un UUID invalide", async () => {
    const res = await request(app).get("/api/sports/not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/sports", () => {
  it("crée un sport (authentifié)", async () => {
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Natation" });

    expect(res.status).toBe(201);
    expect(res.body.sport.name).toBe("Natation");
  });

  it("refuse la création sans authentification", async () => {
    const res = await request(app).post("/api/sports").send({ name: "Yoga" });
    expect(res.status).toBe(401);
  });

  it("refuse un nom dupliqué", async () => {
    await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Running" });

    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Running" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("SPORT_ALREADY_EXISTS");
  });

  it("refuse un nom vide", async () => {
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/sports/:id", () => {
  it("renomme un sport (créateur)", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Badminton" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .patch(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Squash" });

    expect(res.status).toBe(200);
    expect(res.body.sport.name).toBe("Squash");
  });

  it("refuse la mise à jour sans authentification", async () => {
    const res = await request(app)
      .patch(`/api/sports/${randomUUID()}`)
      .send({ name: "Golf" });
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .patch(`/api/sports/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Polo" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });
});

describe("DELETE /api/sports/:id", () => {
  it("supprime un sport (authentifié)", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "VTT" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .delete(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse la suppression sans authentification", async () => {
    const res = await request(app).delete(`/api/sports/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un sport déjà supprimé", async () => {
    const res = await request(app)
      .delete(`/api/sports/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });
});
