import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import {
  resetAll,
  createUser,
  createSport,
  closeTestDb,
} from "../helpers/db.js";

let token: string;
let userId: string;
let sportId: string;

beforeEach(async () => {
  await resetAll();
  ({ userId, token } = await createUser({ email: "user@test.com" }));
  sportId = await createSport("Tennis");
});

afterAll(async () => {
  await closeTestDb();
});

describe("GET /api/users/me", () => {
  it("renvoie le profil de l'utilisateur authentifié", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it("refuse l'accès sans token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });
});

describe("PATCH /api/users/me", () => {
  it("met à jour le pseudo", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ pseudo: "nouveau_pseudo" });

    expect(res.status).toBe(200);
    expect(res.body.user.pseudo).toBe("nouveau_pseudo");
  });

  it("met à jour la bio et la ville", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ bio: "Je fais du sport.", city: "Perpignan" });

    expect(res.status).toBe(200);
    expect(res.body.user.bio).toBe("Je fais du sport.");
    expect(res.body.user.city).toBe("Perpignan");
  });

  it("refuse un body vide", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .send({ pseudo: "hack" });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/users/me", () => {
  it("supprime le compte de l'utilisateur", async () => {
    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/:id", () => {
  it("renvoie le profil public d'un utilisateur", async () => {
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it("renvoie 404 pour un UUID inexistant", async () => {
    const res = await request(app).get(`/api/users/${randomUUID()}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });

  it("renvoie 400 pour un UUID invalide", async () => {
    const res = await request(app).get("/api/users/not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("PUT /api/users/me/sports", () => {
  it("ajoute un sport avec un niveau", async () => {
    const res = await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "INTERMEDIATE" });

    expect(res.status).toBe(200);
    expect(res.body.sport.sportId).toBe(sportId);
    expect(res.body.sport.level).toBe("INTERMEDIATE");
  });

  it("met à jour le niveau si le sport est déjà ajouté", async () => {
    await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "BEGINNER" });

    const res = await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "EXPERT" });

    expect(res.status).toBe(200);
    expect(res.body.sport.level).toBe("EXPERT");
  });

  it("renvoie 404 pour un sportId inexistant", async () => {
    const res = await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId: randomUUID(), level: "BEGINNER" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });

  it("refuse un niveau invalide", async () => {
    const res = await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "DIEU" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .put("/api/users/me/sports")
      .send({ sportId, level: "BEGINNER" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/me/sports", () => {
  it("renvoie la liste vide si aucun sport n'est associé", async () => {
    const res = await request(app)
      .get("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sports).toEqual([]);
  });

  it("renvoie les sports de l'utilisateur", async () => {
    await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "ADVANCED" });

    const res = await request(app)
      .get("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sports).toHaveLength(1);
    expect(res.body.sports[0].level).toBe("ADVANCED");
  });
});

describe("DELETE /api/users/me/sports/:sportId", () => {
  it("retire un sport associé", async () => {
    await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "BEGINNER" });

    const res = await request(app)
      .delete(`/api/users/me/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("renvoie 404 si le sport n'était pas associé", async () => {
    const res = await request(app)
      .delete(`/api/users/me/sports/${sportId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_SPORT_NOT_FOUND");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete(`/api/users/me/sports/${sportId}`);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/:id/sports", () => {
  it("renvoie les sports publics d'un utilisateur", async () => {
    await request(app)
      .put("/api/users/me/sports")
      .set("Authorization", `Bearer ${token}`)
      .send({ sportId, level: "BEGINNER" });

    const res = await request(app).get(`/api/users/${userId}/sports`);
    expect(res.status).toBe(200);
    expect(res.body.sports).toHaveLength(1);
  });
});
