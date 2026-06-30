import request from "supertest";
import { randomUUID } from "node:crypto";
import app from "../../src/app.js";
import { signToken } from "../../src/utils/jwt.js";
import { resetUsers, closeTestDb } from "../helpers/db.js";

const validRegisterBody = {
  pseudo: "testuser",
  email: "test@example.com",
  password: "Password123",
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
