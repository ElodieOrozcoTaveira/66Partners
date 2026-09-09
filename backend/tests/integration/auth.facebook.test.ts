import { jest } from "@jest/globals";
import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../src/app.js";
import { resetUsers, closeTestDb, testDb, createUser } from "../helpers/db.js";
import { socialAccounts, users, userTerritories, territories } from "../../src/db/schema.js";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../../src/utils/jwt.js";

// App ID/Secret non-secrets pour l'environnement de test — absents de
// .env.test car inutiles aux autres suites.
process.env.FACEBOOK_APP_ID = "test-facebook-app-id";
process.env.FACEBOOK_APP_SECRET = "test-facebook-app-secret";

interface MockFacebookProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch as unknown as typeof fetch;

function facebookProfile(overrides: Partial<MockFacebookProfile> = {}): MockFacebookProfile {
  return {
    id: overrides.id ?? `fb-${randomUUID()}`,
    email: overrides.email ?? `fbuser-${randomUUID()}@example.com`,
    first_name: overrides.first_name ?? "Test",
    name: overrides.name ?? "Test Facebook",
  };
}

function jsonResponse(body: unknown): Response {
  return { json: async () => body } as Response;
}

/**
 * Enchaîne les deux appels Graph API attendus par verifyFacebookAccessToken :
 * /debug_token puis /me. Doit être appelé avant CHAQUE requête HTTP qui
 * déclenche une vérification (une paire d'appels fetch par vérification).
 */
function mockFacebookSuccess(profile: MockFacebookProfile) {
  mockFetch.mockResolvedValueOnce(
    jsonResponse({ data: { app_id: "test-facebook-app-id", is_valid: true, user_id: profile.id } }),
  );
  mockFetch.mockResolvedValueOnce(jsonResponse(profile));
}

function mockFacebookInvalidToken() {
  mockFetch.mockResolvedValueOnce(jsonResponse({ data: { is_valid: false } }));
}

beforeEach(async () => {
  await resetUsers();
  mockFetch.mockReset();
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/auth/facebook", () => {
  it("1. refuse une requête sans accessToken", async () => {
    const res = await request(app).post("/api/auth/facebook").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("2. refuse un token Facebook invalide", async () => {
    mockFacebookInvalidToken();

    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "bad-token" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: "INVALID_FACEBOOK_TOKEN" });
  });

  it("refuse un compte Facebook sans email", async () => {
    const profile = facebookProfile();
    delete profile.email;
    mockFacebookSuccess(profile);

    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("FACEBOOK_EMAIL_MISSING");
  });

  it("3. connecte un utilisateur dont le compte Facebook est déjà lié", async () => {
    const { userId } = await createUser({ email: "linked@example.com" });
    const fbId = `fb-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "facebook", providerUserId: fbId, email: "linked@example.com" });

    mockFacebookSuccess(facebookProfile({ id: fbId, email: "linked@example.com" }));

    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "LOGGED_IN" });
    expect(res.body.user.id).toBe(userId);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("4. renvoie NEW_ACCOUNT pour un Facebook et un email inconnus, sans rien créer", async () => {
    const email = `newuser-${randomUUID()}@example.com`;
    mockFacebookSuccess(facebookProfile({ email }));

    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "NEW_ACCOUNT", email });

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(0);
  });

  it("6. renvoie EMAIL_ALREADY_REGISTERED sans fusion ni création si l'email existe déjà", async () => {
    const email = `taken-${randomUUID()}@example.com`;
    await createUser({ email });

    mockFacebookSuccess(facebookProfile({ email }));
    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "EMAIL_ALREADY_REGISTERED", email });

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });
});

describe("POST /api/auth/facebook/complete", () => {
  it("5. crée le compte, l'associe au territoire 66 et lie le compte Facebook", async () => {
    const email = `complete-${randomUUID()}@example.com`;
    const fbId = `fb-${randomUUID()}`;
    mockFacebookSuccess(facebookProfile({ id: fbId, email }));

    const res = await request(app)
      .post("/api/auth/facebook/complete")
      .send({ accessToken: "tok", termsAccepted: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({ email });
    expect(res.body.token).toEqual(expect.any(String));

    const userId = res.body.user.id as string;

    const [territory66] = await testDb.select().from(territories).where(eq(territories.code, "66"));
    expect(territory66).toBeDefined();

    const [membership] = await testDb
      .select()
      .from(userTerritories)
      .where(
        and(eq(userTerritories.userId, userId), eq(userTerritories.territoryId, territory66!.id)),
      );
    expect(membership).toBeDefined();

    const [social] = await testDb
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
    expect(social).toMatchObject({ provider: "facebook", providerUserId: fbId });
  });

  it("6bis. refuse la création si l'email a été pris entre-temps (pas de fusion)", async () => {
    const email = `race-${randomUUID()}@example.com`;
    await createUser({ email });

    mockFacebookSuccess(facebookProfile({ email }));
    const res = await request(app)
      .post("/api/auth/facebook/complete")
      .send({ accessToken: "tok", termsAccepted: true });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_ALREADY_REGISTERED");

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });

  it("11. refuse la finalisation si termsAccepted n'est pas exactement true", async () => {
    const resFalse = await request(app)
      .post("/api/auth/facebook/complete")
      .send({ accessToken: "tok", termsAccepted: false });
    expect(resFalse.status).toBe(400);

    const resMissing = await request(app)
      .post("/api/auth/facebook/complete")
      .send({ accessToken: "tok" });
    expect(resMissing.status).toBe(400);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/facebook/link", () => {
  it("7. associe Facebook à un compte existant après un login mot de passe, et les connexions suivantes aboutissent au même compte", async () => {
    const email = `link-${randomUUID()}@example.com`;
    const password = "Password123";
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "linkuser", email, password, termsAccepted: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    const token = loginRes.body.token as string;
    const userId = loginRes.body.user.id as string;

    const fbId = `fb-${randomUUID()}`;
    mockFacebookSuccess(facebookProfile({ id: fbId, email }));

    const linkRes = await request(app)
      .post("/api/auth/facebook/link")
      .set("Authorization", `Bearer ${token}`)
      .send({ accessToken: "tok" });

    expect(linkRes.status).toBe(200);
    expect(linkRes.body.success).toBe(true);

    mockFacebookSuccess(facebookProfile({ id: fbId, email }));
    const nextLogin = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    expect(nextLogin.body.status).toBe("LOGGED_IN");
    expect(nextLogin.body.user.id).toBe(userId);
  });

  it("refuse d'associer un compte Facebook déjà lié à un AUTRE utilisateur (anti-prise de compte)", async () => {
    const { userId: victim } = await createUser({ email: "victim@example.com" });
    const fbId = `fb-${randomUUID()}`;
    await testDb.insert(socialAccounts).values({
      userId: victim,
      provider: "facebook",
      providerUserId: fbId,
      email: "victim@example.com",
    });

    const attackerEmail = `attacker-${randomUUID()}@example.com`;
    const password = "Password123";
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "attacker", email: attackerEmail, password, termsAccepted: true });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: attackerEmail, password });
    const attackerToken = loginRes.body.token as string;

    mockFacebookSuccess(facebookProfile({ id: fbId, email: "victim@example.com" }));

    const res = await request(app)
      .post("/api/auth/facebook/link")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ accessToken: "tok" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("FACEBOOK_ACCOUNT_ALREADY_LINKED");
  });
});

describe("JWT et non-duplication", () => {
  it("8. le JWT renvoyé après connexion Facebook a exactement le même format que le JWT classique ({ id })", async () => {
    const email = `jwtcheck-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const fbId = `fb-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "facebook", providerUserId: fbId, email });

    mockFacebookSuccess(facebookProfile({ id: fbId, email }));
    const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });

    const decoded = verifyToken(res.body.token as string) as unknown as Record<string, unknown>;
    expect(decoded.id).toBe(userId);
    expect(Object.keys(decoded).sort()).toEqual(["exp", "iat", "id"]);
  });

  it("9. plusieurs connexions Facebook successives ne créent aucun doublon", async () => {
    const email = `repeat-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const fbId = `fb-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "facebook", providerUserId: fbId, email });

    for (let i = 0; i < 3; i++) {
      mockFacebookSuccess(facebookProfile({ id: fbId, email }));
      const res = await request(app).post("/api/auth/facebook").send({ accessToken: "tok" });
      expect(res.body.status).toBe("LOGGED_IN");
      expect(res.body.user.id).toBe(userId);
    }

    const socialRows = await testDb
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.providerUserId, fbId));
    expect(socialRows).toHaveLength(1);

    const userRows = await testDb.select().from(users).where(eq(users.email, email));
    expect(userRows).toHaveLength(1);
  });

  it("10. la contrainte UNIQUE(provider, provider_user_id) empêche deux utilisateurs d'avoir le même compte Facebook", async () => {
    const { userId: userA } = await createUser({ email: "usera-fb@example.com" });
    const { userId: userB } = await createUser({ email: "userb-fb@example.com" });
    const fbId = `fb-${randomUUID()}`;

    await testDb.insert(socialAccounts).values({
      userId: userA,
      provider: "facebook",
      providerUserId: fbId,
      email: "usera-fb@example.com",
    });

    await expect(
      testDb.insert(socialAccounts).values({
        userId: userB,
        provider: "facebook",
        providerUserId: fbId,
        email: "userb-fb@example.com",
      }),
    ).rejects.toThrow();
  });

  it("un même provider_user_id sur google et facebook n'est pas confondu (clé composite)", async () => {
    const sharedId = `shared-${randomUUID()}`;
    const { userId: googleUser } = await createUser({ email: "googleuser@example.com" });
    const { userId: facebookUser } = await createUser({ email: "facebookuser@example.com" });

    await testDb.insert(socialAccounts).values({
      userId: googleUser,
      provider: "google",
      providerUserId: sharedId,
      email: "googleuser@example.com",
    });
    await testDb.insert(socialAccounts).values({
      userId: facebookUser,
      provider: "facebook",
      providerUserId: sharedId,
      email: "facebookuser@example.com",
    });

    const rows = await testDb
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.providerUserId, sharedId));
    expect(rows).toHaveLength(2);
  });
});

describe("Non-régression — login classique", () => {
  it("12. le login email/mot de passe fonctionne toujours normalement", async () => {
    const email = `regression-fb-${randomUUID()}@example.com`;
    const password = "Password123";
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "regressionfb", email, password, termsAccepted: true });

    const res = await request(app).post("/api/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });
});
