import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import { resetAll, resetSports, createUser, closeTestDb } from "../helpers/db.js";
import { signAdminToken } from "../../src/utils/adminJwt.js";

let token: string;
// Jeton admin signé directement (comme createUser() le fait pour un jeton
// utilisateur) : n'exerce pas /api/admin/auth/login (mot de passe inconnu
// des tests), seulement le contrôle réellement en jeu ici — requireAdminAuth
// sur les routes d'écriture des sports.
const adminToken = signAdminToken();

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
      .set("Authorization", `Bearer ${adminToken}`)
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
      .set("Authorization", `Bearer ${adminToken}`)
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

// ─── Écriture (POST/PATCH/DELETE) — réservée à l'admin (audit sécurité, étape 3) ───

describe("POST /api/sports", () => {
  it("crée un sport (admin)", async () => {
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Natation" });

    expect(res.status).toBe(201);
    expect(res.body.sport.name).toBe("Natation");
  });

  it("refuse la création sans authentification", async () => {
    const res = await request(app).post("/api/sports").send({ name: "Yoga" });
    expect(res.status).toBe(401);
  });

  it("refuse la création par un utilisateur authentifié non-admin", async () => {
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Escalade" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);

    // Confirme qu'aucun sport n'a bien été créé (pas seulement un statut
    // d'erreur en façade).
    const list = await request(app).get("/api/sports");
    expect(list.body.sports).toEqual([]);
  });

  it("refuse un jeton utilisateur normal réutilisé tel quel côté admin (pas d'escalade via le même token)", async () => {
    // Un utilisateur ne peut pas se faire passer pour l'admin en présentant
    // son propre JWT : les deux sont signés avec des secrets différents.
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Escrime" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("ADMIN_INVALID_TOKEN");
  });

  it("refuse un nom dupliqué", async () => {
    await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Running" });

    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Running" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("SPORT_ALREADY_EXISTS");
  });

  it("refuse un nom vide", async () => {
    const res = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PATCH /api/sports/:id", () => {
  it("renomme un sport (admin)", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Badminton" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .patch(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${adminToken}`)
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

  it("refuse la mise à jour par un utilisateur authentifié non-admin", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Aviron" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .patch(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Piraterie" });

    expect(res.status).toBe(401);

    // Le sport n'a pas été modifié.
    const check = await request(app).get(`/api/sports/${sportId}`);
    expect(check.body.sport.name).toBe("Aviron");
  });

  it("renvoie 404 pour un ID inexistant (admin)", async () => {
    const res = await request(app)
      .patch(`/api/sports/${randomUUID()}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Polo" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });
});

describe("DELETE /api/sports/:id", () => {
  it("supprime un sport (admin)", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "VTT" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .delete(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse la suppression sans authentification", async () => {
    const res = await request(app).delete(`/api/sports/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("refuse la suppression par un utilisateur authentifié non-admin", async () => {
    const createRes = await request(app)
      .post("/api/sports")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Curling" });
    const sportId = createRes.body.sport.id as string;

    const res = await request(app)
      .delete(`/api/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);

    // Le sport existe toujours.
    const check = await request(app).get(`/api/sports/${sportId}`);
    expect(check.status).toBe(200);
  });

  it("renvoie 404 pour un sport déjà supprimé (admin)", async () => {
    const res = await request(app)
      .delete(`/api/sports/${randomUUID()}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });
});
