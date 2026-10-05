import request from "supertest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import app from "../../src/app.js";
import { userTerritories } from "../../src/db/schema.js";
import {
  resetAll,
  createUser,
  createSport,
  createTerritory,
  attachUserToTerritory,
  closeTestDb,
  testDb,
} from "../helpers/db.js";

let token: string;
let userId: string;
let sportId: string;

beforeEach(async () => {
  await resetAll();
  ({ userId, token } = await createUser({ email: "user@test.com", pseudo: "user_cible" }));
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

  it("inclut l'email du propriétaire (donnée privée réservée à /me)", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user@test.com");
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

  it("met à jour le headline et la ville", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ headline: "Je fais du sport.", city: "Perpignan" });

    expect(res.status).toBe(200);
    expect(res.body.user.headline).toBe("Je fais du sport.");
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
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.pseudo).toBe("user_cible");
  });

  it("ne renvoie jamais l'email ni la géolocalisation d'un autre utilisateur (F-01)", async () => {
    // La cible enregistre une position exacte sur son propre profil...
    await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 42.5, longitude: 2.9 });

    // ...un AUTRE utilisateur consulte ce profil : email et coordonnées
    // ne doivent jamais apparaître dans la réponse, quels que soient les
    // champs présents en base.
    const { token: otherToken } = await createUser({ email: "other@test.com" });

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).not.toHaveProperty("email");
    expect(res.body.user).not.toHaveProperty("latitude");
    expect(res.body.user).not.toHaveProperty("longitude");
    expect(res.body.user.pseudo).toBe("user_cible");
  });

  it("1. expose le territoire d'inscription (isDefault=true) sur le profil public", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory).toMatchObject({
      code: "66",
      name: expect.any(String),
      brandName: "66Partners",
    });
  });

  it("2. utilisateur multi-territoires : expose uniquement celui avec isDefault=true, jamais un autre", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    await attachUserToTerritory(userId, territory34.id); // isDefault=false par défaut (join, jamais principal)

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory.code).toBe("66");
  });

  it("3. ne renvoie qu'un seul territoire (jamais la liste complète des memberships)", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    await attachUserToTerritory(userId, territory34.id);

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory).not.toBeInstanceOf(Array);
    expect(res.body.user).not.toHaveProperty("territories");
    expect(res.body.user).not.toHaveProperty("userTerritories");
    expect(Object.keys(res.body.user.territory).sort()).toEqual(["brandName", "code", "name"]);
  });

  it("4. utilisateur sans territoire par défaut : territory=null, jamais un territoire inventé (200, pas d'erreur)", async () => {
    // Retire le statut isDefault du seul membership existant, sans en
    // recréer un autre — simule un compte dont la donnée serait absente.
    await testDb
      .update(userTerritories)
      .set({ isDefault: false })
      .where(eq(userTerritories.userId, userId));

    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory).toBeNull();
  });

  it("6. aucune donnée sensible exposée via le champ territory (pas d'ID interne, pas d'isActive/dates)", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory).not.toHaveProperty("id");
    expect(res.body.user.territory).not.toHaveProperty("isActive");
    expect(res.body.user.territory).not.toHaveProperty("createdAt");
  });

  it("7. le territoire affiché ne dépend jamais d'un territoire actif transmis par le visiteur", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    await attachUserToTerritory(userId, territory34.id);

    // Un éventuel paramètre `territory` dans la query (contexte du visiteur)
    // ne doit avoir strictement aucun effet : seul isDefault compte.
    const res = await request(app)
      .get(`/api/users/${userId}?territory=34`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.territory.code).toBe("66");
  });

  it("renvoie 404 pour un UUID inexistant", async () => {
    const res = await request(app)
      .get(`/api/users/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });

  it("renvoie 400 pour un UUID invalide", async () => {
    const res = await request(app)
      .get("/api/users/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.status).toBe(401);
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

    const res = await request(app)
      .get(`/api/users/${userId}/sports`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sports).toHaveLength(1);
  });
});
