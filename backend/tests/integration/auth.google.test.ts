import { jest } from "@jest/globals";
import { randomUUID } from "node:crypto";

// Client OAuth non-secret, mais nécessaire pour que verifyGoogleCredential ne
// court-circuite pas sur GOOGLE_NOT_CONFIGURED — absent de .env.test car pas
// utile aux autres suites.
process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

interface MockGooglePayload {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

const mockVerifyIdToken =
  jest.fn<() => Promise<{ getPayload: () => MockGooglePayload | undefined }>>();

// google-auth-library est mocké AVANT tout import (même transitif) de
// src/app.js : `verifyIdToken` est la seule frontière avec le vrai Google,
// aucun jeton Google réel n'est disponible en environnement de test.
jest.unstable_mockModule("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { resetUsers, closeTestDb, testDb, createUser } = await import("../helpers/db.js");
const { socialAccounts, users, userTerritories, territories } = await import(
  "../../src/db/schema.js"
);
const { eq, and } = await import("drizzle-orm");
const { verifyToken } = await import("../../src/utils/jwt.js");
const { AuthService } = await import("../../src/services/auth.services.js");

function googlePayload(overrides: Partial<MockGooglePayload> = {}): MockGooglePayload {
  return {
    sub: overrides.sub ?? `google-sub-${randomUUID()}`,
    email: overrides.email ?? `googleuser-${randomUUID()}@example.com`,
    email_verified: overrides.email_verified ?? true,
    given_name: overrides.given_name ?? "Test",
    name: overrides.name ?? "Test Google",
    picture: overrides.picture,
  };
}

function mockGoogleSuccess(payload: MockGooglePayload) {
  mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => payload });
}

beforeEach(async () => {
  await resetUsers();
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/auth/google", () => {
  it("1. refuse une requête sans credential", async () => {
    const res = await request(app).post("/api/auth/google").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("2. refuse un token Google invalide", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("invalid token"));

    const res = await request(app).post("/api/auth/google").send({ credential: "bad-token" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: "INVALID_GOOGLE_TOKEN" });
  });

  it("3. connecte un utilisateur dont le compte Google est déjà lié", async () => {
    const { userId } = await createUser({ email: "linked@example.com" });
    const sub = `sub-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "google", providerUserId: sub, email: "linked@example.com" });

    mockGoogleSuccess(googlePayload({ sub, email: "linked@example.com" }));

    const res = await request(app).post("/api/auth/google").send({ credential: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "LOGGED_IN" });
    expect(res.body.user.id).toBe(userId);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("4. renvoie NEW_ACCOUNT pour un Google et un email inconnus, sans rien créer", async () => {
    const email = `newuser-${randomUUID()}@example.com`;
    mockGoogleSuccess(googlePayload({ email }));

    const res = await request(app).post("/api/auth/google").send({ credential: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "NEW_ACCOUNT", email });

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(0);
  });

  it("6. renvoie EMAIL_ALREADY_REGISTERED sans fusion ni création si l'email existe déjà", async () => {
    const email = `taken-${randomUUID()}@example.com`;
    await createUser({ email });

    mockGoogleSuccess(googlePayload({ email }));
    const res = await request(app).post("/api/auth/google").send({ credential: "tok" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "EMAIL_ALREADY_REGISTERED", email });

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });
});

// La base de test est persistante pour les territoires : la ligne "34" peut
// avoir été laissée dans un état quelconque par d'autres suites. On la
// ramène à sa définition canonique (TERRITORY_SEEDS), même duplication que
// resetTerritory34 dans territorySelection.test.ts.
async function resetTerritory34(isActive: boolean) {
  const { TERRITORY_SEEDS } = await import("../../src/db/seed-territories.js");
  const seed34 = TERRITORY_SEEDS.find((t) => t.code === "34")!;
  await testDb
    .insert(territories)
    .values({ code: "34", name: seed34.name, slug: seed34.slug, brandName: seed34.brandName, isActive })
    .onConflictDoNothing({ target: territories.code });
  await testDb
    .update(territories)
    .set({
      name: seed34.name,
      slug: seed34.slug,
      brandName: seed34.brandName,
      inseeDepartmentCode: seed34.inseeDepartmentCode,
      tagline: seed34.tagline,
      assetsPath: seed34.assetsPath,
      isActive,
    })
    .where(eq(territories.code, "34"));
}

describe("POST /api/auth/google/complete", () => {
  it("5. crée le compte, l'associe au territoire 66 et lie le compte Google", async () => {
    const email = `complete-${randomUUID()}@example.com`;
    const sub = `sub-${randomUUID()}`;
    mockGoogleSuccess(googlePayload({ sub, email }));

    const res = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({ email });
    expect(res.body.token).toEqual(expect.any(String));

    const userId = res.body.user.id as string;

    const [territory66] = await testDb
      .select()
      .from(territories)
      .where(eq(territories.code, "66"));
    expect(territory66).toBeDefined();

    const [membership] = await testDb
      .select()
      .from(userTerritories)
      .where(
        and(
          eq(userTerritories.userId, userId),
          eq(userTerritories.territoryId, territory66!.id),
        ),
      );
    expect(membership).toBeDefined();

    const [social] = await testDb
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
    expect(social).toMatchObject({ provider: "google", providerUserId: sub });
  });

  describe("choix du territoire (territoryCode)", () => {
    // Appel direct à AuthService.completeGoogleSignup (pas de requête HTTP) :
    // googleAuthLimiter (20 req/15 min, PARTAGÉ par /google, /google/complete
    // et /google/link) est déjà entièrement consommé par le reste de ce
    // fichier — une requête HTTP de plus ferait échouer un autre test
    // (429). Le plumbing HTTP → controller → validation du territoryCode
    // est lui-même trivial (req.body.territoryCode transmis tel quel, cf.
    // auth.controller.ts) et déjà exercé pour /register dans
    // territorySelection.test.ts ; ce qui reste à couvrir spécifiquement à
    // l'inscription Google, c'est que completeGoogleSignup propage bien
    // territoryCode jusqu'à resolveSignupTerritory — testable sans HTTP.
    it("rattache UNIQUEMENT au territoire 34 quand il est choisi, même si le 66 est aussi actif", async () => {
      await resetTerritory34(true);
      const email = `complete34-${randomUUID()}@example.com`;

      const created = await AuthService.completeGoogleSignup(
        { sub: `sub-${randomUUID()}`, email, emailVerified: true },
        true,
        "34",
      );

      const rows = await testDb
        .select({ code: territories.code })
        .from(userTerritories)
        .innerJoin(territories, eq(territories.id, userTerritories.territoryId))
        .where(eq(userTerritories.userId, created.id));
      expect(rows.map((r) => r.code)).toEqual(["34"]);

      await resetTerritory34(false);
    });

    it("refuse un territoire inactif sans créer de compte", async () => {
      await resetTerritory34(false);
      const email = `completeinactive-${randomUUID()}@example.com`;

      await expect(
        AuthService.completeGoogleSignup(
          { sub: `sub-${randomUUID()}`, email, emailVerified: true },
          true,
          "34",
        ),
      ).rejects.toMatchObject({ code: "TERRITORY_NOT_ACTIVE", statusCode: 400 });

      const rows = await testDb.select().from(users).where(eq(users.email, email));
      expect(rows).toHaveLength(0);
    });
  });

  it("6bis. refuse la création si l'email a été pris entre-temps (pas de fusion)", async () => {
    const email = `race-${randomUUID()}@example.com`;
    await createUser({ email });

    mockGoogleSuccess(googlePayload({ email }));
    const res = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: true });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_ALREADY_REGISTERED");

    const rows = await testDb.select().from(users).where(eq(users.email, email));
    expect(rows).toHaveLength(1);
  });

  it("11. refuse la finalisation si termsAccepted n'est pas exactement true", async () => {
    const resFalse = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: false });
    expect(resFalse.status).toBe(400);
    expect(resFalse.body.success).toBe(false);

    const resMissing = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok" });
    expect(resMissing.status).toBe(400);
    expect(resMissing.body.success).toBe(false);

    // La validation Zod rejette avant tout appel à Google : aucun compte ne
    // peut être créé sans acceptation explicite des CGU.
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/google/link", () => {
  it("7. associe Google à un compte existant après un login mot de passe, et les connexions suivantes aboutissent au même compte", async () => {
    const email = `link-${randomUUID()}@example.com`;
    const password = "Password123";
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "linkuser", email, password, termsAccepted: true });
    const loginRes = await request(app).post("/api/auth/login").send({ email, password });
    const token = loginRes.body.token as string;
    const userId = loginRes.body.user.id as string;

    const sub = `sub-${randomUUID()}`;
    mockGoogleSuccess(googlePayload({ sub, email }));

    const linkRes = await request(app)
      .post("/api/auth/google/link")
      .set("Authorization", `Bearer ${token}`)
      .send({ credential: "tok" });

    expect(linkRes.status).toBe(200);
    expect(linkRes.body.success).toBe(true);

    mockGoogleSuccess(googlePayload({ sub, email }));
    const nextLogin = await request(app).post("/api/auth/google").send({ credential: "tok" });

    expect(nextLogin.body.status).toBe("LOGGED_IN");
    expect(nextLogin.body.user.id).toBe(userId);
  });

  it("refuse d'associer un compte Google déjà lié à un AUTRE utilisateur (anti-prise de compte)", async () => {
    const { userId: victim } = await createUser({ email: "victim@example.com" });
    const sub = `sub-${randomUUID()}`;
    await testDb.insert(socialAccounts).values({
      userId: victim,
      provider: "google",
      providerUserId: sub,
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

    mockGoogleSuccess(googlePayload({ sub, email: "victim@example.com" }));

    const res = await request(app)
      .post("/api/auth/google/link")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ credential: "tok" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("GOOGLE_ACCOUNT_ALREADY_LINKED");
  });
});

describe("JWT et non-duplication", () => {
  it("8. le JWT renvoyé après connexion Google a exactement le même format que le JWT classique ({ id })", async () => {
    const email = `jwtcheck-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const sub = `sub-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "google", providerUserId: sub, email });

    mockGoogleSuccess(googlePayload({ sub, email }));
    const res = await request(app).post("/api/auth/google").send({ credential: "tok" });

    const decoded = verifyToken(res.body.token as string) as unknown as Record<string, unknown>;
    expect(decoded.id).toBe(userId);
    expect(Object.keys(decoded).sort()).toEqual(["exp", "iat", "id"]);
  });

  it("9. plusieurs connexions Google successives ne créent aucun doublon", async () => {
    const email = `repeat-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const sub = `sub-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "google", providerUserId: sub, email });

    for (let i = 0; i < 3; i++) {
      mockGoogleSuccess(googlePayload({ sub, email }));
      const res = await request(app).post("/api/auth/google").send({ credential: "tok" });
      expect(res.body.status).toBe("LOGGED_IN");
      expect(res.body.user.id).toBe(userId);
    }

    const socialRows = await testDb
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.providerUserId, sub));
    expect(socialRows).toHaveLength(1);

    const userRows = await testDb.select().from(users).where(eq(users.email, email));
    expect(userRows).toHaveLength(1);
  });

  it("10. la contrainte UNIQUE(provider, provider_user_id) empêche deux utilisateurs d'avoir le même compte Google", async () => {
    const { userId: userA } = await createUser({ email: "usera@example.com" });
    const { userId: userB } = await createUser({ email: "userb@example.com" });
    const sub = `sub-${randomUUID()}`;

    await testDb
      .insert(socialAccounts)
      .values({ userId: userA, provider: "google", providerUserId: sub, email: "usera@example.com" });

    await expect(
      testDb
        .insert(socialAccounts)
        .values({ userId: userB, provider: "google", providerUserId: sub, email: "userb@example.com" }),
    ).rejects.toThrow();
  });
});

describe("Avatar Google", () => {
  it("13. remplace le suffixe de taille Google (=s96-c) par une résolution plus grande à l'inscription", async () => {
    const email = `avatar-signup-${randomUUID()}@example.com`;
    const sub = `sub-${randomUUID()}`;
    mockGoogleSuccess(
      googlePayload({
        sub,
        email,
        picture: "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
      }),
    );

    const res = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: true });

    expect(res.status).toBe(201);
    expect(res.body.user.avatar).toBe("https://lh3.googleusercontent.com/a/ACg8ocExample=s400-c");
  });

  it("14. n'invente rien si l'URL Google ne correspond pas au format de suffixe de taille connu", async () => {
    const email = `avatar-unknown-format-${randomUUID()}@example.com`;
    const sub = `sub-${randomUUID()}`;
    mockGoogleSuccess(
      googlePayload({ sub, email, picture: "https://example.com/some/other/photo.jpg" }),
    );

    const res = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: true });

    expect(res.status).toBe(201);
    expect(res.body.user.avatar).toBe("https://example.com/some/other/photo.jpg");
  });

  it("15. fallback : aucune photo fournie par Google, avatar reste null, pas de crash", async () => {
    const email = `avatar-fallback-${randomUUID()}@example.com`;
    const sub = `sub-${randomUUID()}`;
    mockGoogleSuccess(googlePayload({ sub, email }));

    const res = await request(app)
      .post("/api/auth/google/complete")
      .send({ credential: "tok", termsAccepted: true });

    expect(res.status).toBe(201);
    expect(res.body.user.avatar).toBeNull();
  });

  it("16. une connexion suivante remplace un ancien avatar Google basse résolution par la version haute résolution", async () => {
    const email = `avatar-refresh-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const sub = `sub-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "google", providerUserId: sub, email });
    await testDb
      .update(users)
      .set({ avatar: "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c" })
      .where(eq(users.id, userId));

    mockGoogleSuccess(
      googlePayload({
        sub,
        email,
        picture: "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
      }),
    );
    await request(app).post("/api/auth/google").send({ credential: "tok" });

    // Le rafraîchissement est fire-and-forget (ne bloque pas la réponse de
    // connexion) : on attend juste qu'il ait eu le temps de s'exécuter.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const [updated] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(updated?.avatar).toBe("https://lh3.googleusercontent.com/a/ACg8ocExample=s400-c");
  });

  it("17. ne remplace jamais un avatar personnalisé (non Google) déjà choisi par l'utilisateur", async () => {
    const email = `avatar-custom-${randomUUID()}@example.com`;
    const { userId } = await createUser({ email });
    const sub = `sub-${randomUUID()}`;
    await testDb
      .insert(socialAccounts)
      .values({ userId, provider: "google", providerUserId: sub, email });
    await testDb
      .update(users)
      .set({ avatar: "/uploads/avatars/mon-avatar-perso.webp" })
      .where(eq(users.id, userId));

    mockGoogleSuccess(
      googlePayload({
        sub,
        email,
        picture: "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
      }),
    );
    await request(app).post("/api/auth/google").send({ credential: "tok" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const [updated] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(updated?.avatar).toBe("/uploads/avatars/mon-avatar-perso.webp");
  });
});

describe("Non-régression — login classique", () => {
  it("12. le login email/mot de passe fonctionne toujours normalement", async () => {
    const email = `regression-${randomUUID()}@example.com`;
    const password = "Password123";
    await request(app)
      .post("/api/auth/register")
      .send({ pseudo: "regression", email, password, termsAccepted: true });

    const res = await request(app).post("/api/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });
});
