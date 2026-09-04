import request from "supertest";
import express from "express";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import { signToken } from "../../src/utils/jwt.js";
import { resetUsers, closeTestDb } from "../helpers/db.js";
import { createAuthRateLimiter } from "../../src/middlewares/rateLimit.middleware.js";


const validRegisterBody = {
  pseudo: "testuser",
  email: "test@example.com",
  password: "Password123",
  termsAccepted: true,
};

beforeEach(async () => {
  await resetUsers();
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/auth/register", () => {
  it("crée un utilisateur et renvoie un token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: validRegisterBody.email,
      pseudo: validRegisterBody.pseudo,
    });
    expect(res.body.user.password).toBeUndefined();
  });

  it("refuse un email déjà utilisé (insensible à la casse)", async () => {
    await request(app).post("/api/auth/register").send(validRegisterBody);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterBody, email: "TEST@example.com" });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      success: false,
      code: "USER_ALREADY_EXISTS",
    });
  });

  it("refuse un mot de passe trop court", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterBody, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "password" })])
    );
  });

  it("refuse un email invalide", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterBody, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse un pseudo manquant", async () => {
    const { pseudo, ...rest } = validRegisterBody;
    const res = await request(app).post("/api/auth/register").send(rest);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse une inscription sans acceptation des CGU (champ absent)", async () => {
    const { termsAccepted, ...rest } = validRegisterBody;
    void termsAccepted;
    const res = await request(app).post("/api/auth/register").send(rest);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse une inscription avec termsAccepted à false", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterBody, termsAccepted: false });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("accepte une inscription avec termsAccepted à true", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(validRegisterBody);
  });

  it("connecte un utilisateur avec les bons identifiants", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: validRegisterBody.email,
      password: validRegisterBody.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(validRegisterBody.email);
  });

  it("refuse un mot de passe incorrect", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: validRegisterBody.email,
      password: "WrongPassword1",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("refuse un email inconnu", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "inconnu@example.com",
      password: validRegisterBody.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("refuse une requête sans mot de passe", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: validRegisterBody.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/auth/me", () => {
  it("refuse l'accès sans token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHENTICATED");
  });

  it("refuse un token invalide", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-valid-token");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("renvoie le profil pour un token valide", async () => {
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(validRegisterBody);
    const token = registerRes.body.token as string;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: validRegisterBody.email,
      pseudo: validRegisterBody.pseudo,
    });
  });

  it("renvoie 404 si l'utilisateur du token n'existe plus", async () => {
    const token = signToken({ id: randomUUID() });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });
});

// ─── Rate limiting (P0-1) ───────────────────────────────────────────────
//
// loginLimiter et forgotPasswordLimiter sont clés sur (ip, email) : chaque
// test utilise un email unique, donc aucun risque de contamination avec les
// autres tests du fichier quel que soit l'ordre d'exécution.
//
// registerLimiter est clé sur l'IP seule (partagée par toute la suite, qui
// enchaîne déjà plusieurs inscriptions légitimes) : pousser jusqu'à son
// vrai seuil de production sur /api/auth/register polluerait durablement
// les autres tests. On vérifie donc le même mécanisme — construit par la
// même fabrique `createAuthRateLimiter` que le limiteur réel — sur une
// application jetable, avec un seuil/une fenêtre courts. resetPasswordLimiter
// n'est en revanche touché par aucun autre test du fichier : il est testé
// directement sur le vrai endpoint, sans ce détour.

describe("Rate limiting — login (P0-1)", () => {
  it("laisse passer plusieurs tentatives puis bloque au-delà du seuil (429)", async () => {
    const email = `ratelimit_login_${randomUUID()}@example.com`;
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "rlLogin", email, password: "Password123", termsAccepted: true });

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "WrongPassword1" });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword1" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });

    // Même avec le bon mot de passe : c'est le couple (ip, email) qui est
    // throttlé, pas seulement les tentatives ratées.
    const stillBlocked = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Password123" });
    expect(stillBlocked.status).toBe(429);
  });

  it("ne bloque pas la connexion pour un email différent", async () => {
    const email = `ratelimit_login_other_${randomUUID()}@example.com`;
    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword1" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword1" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("Rate limiting — forgot-password (P0-1)", () => {
  it("bloque après 5 demandes pour le même email (429)", async () => {
    const email = `ratelimit_forgot_${randomUUID()}@example.com`;

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/auth/forgot-password").send({ email });
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post("/api/auth/forgot-password").send({ email });
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });
  });
});

describe("Rate limiting — reset-password (P0-1)", () => {
  it("bloque après 20 tentatives (429), avec une réponse HTTP cohérente", async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: `invalid-token-${i}`, password: "Password123" });
      expect(res.status).toBe(400); // token invalide, mais pas encore throttlé
      expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
    }

    const blocked = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalid-token-21", password: "Password123" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });
  });
});

describe("Rate limiting — mécanisme de seuil/fenêtre (register/reset-password)", () => {
  function buildSandboxApp(limiter: ReturnType<typeof createAuthRateLimiter>) {
    const sandbox = express();
    sandbox.use(express.json());
    sandbox.post("/probe", limiter, (_req, res) => {
      res.status(200).json({ ok: true });
    });
    return sandbox;
  }

  it("bloque au seuil configuré puis redevient utilisable après expiration de la fenêtre", async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 250,
      limit: 3,
      message: "Trop de requêtes.",
    });
    const sandbox = buildSandboxApp(limiter);

    for (let i = 0; i < 3; i++) {
      const res = await request(sandbox).post("/probe").send({});
      expect(res.status).toBe(200);
    }

    const blocked = await request(sandbox).post("/probe").send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const afterWindow = await request(sandbox).post("/probe").send({});
    expect(afterWindow.status).toBe(200);
  });

  it("avec skipFailedRequests, seules les réponses de succès comptent dans le quota", async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 60_000,
      limit: 2,
      message: "Trop de requêtes.",
      skipFailedRequests: true,
    });
    const sandbox = express();
    sandbox.use(express.json());
    sandbox.post("/probe", limiter, (req, res) => {
      if (req.body?.fail) {
        res.status(400).json({ ok: false });
        return;
      }
      res.status(200).json({ ok: true });
    });

    // 5 échecs ne consomment jamais le quota (limite = 2 succès).
    for (let i = 0; i < 5; i++) {
      const res = await request(sandbox).post("/probe").send({ fail: true });
      expect(res.status).toBe(400);
    }

    const ok1 = await request(sandbox).post("/probe").send({});
    const ok2 = await request(sandbox).post("/probe").send({});
    expect(ok1.status).toBe(200);
    expect(ok2.status).toBe(200);

    const blocked = await request(sandbox).post("/probe").send({});
    expect(blocked.status).toBe(429);
  });
});
