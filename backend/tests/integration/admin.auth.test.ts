import { jest } from "@jest/globals";
import crypto from "node:crypto";

const mockSendAdminResetPasswordEmail =
  jest.fn<(resetUrl: string) => Promise<void>>().mockResolvedValue(undefined);

// mail.services.ts est mocké AVANT tout import (même transitif) de
// src/app.js : ça évite tout appel SMTP réel en test (aucune credential
// n'existe dans .env.test), même pattern que le mock de google-auth-library
// dans auth.google.test.ts. Les autres exports sont stubbés (jamais appelés
// par ce fichier) car app.js les importe statiquement via auth.services.ts /
// contact.controller.ts — un module mocké doit fournir toutes les exports
// utilisées par le reste de la chaîne d'imports.
jest.unstable_mockModule("../../src/services/mail.services.js", () => ({
  sendAdminResetPasswordEmail: mockSendAdminResetPasswordEmail,
  sendWelcomeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendContactEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAccountDeletedEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { testDb, closeTestDb } = await import("../helpers/db.js");
const { adminCredentials } = await import("../../src/db/schema.js");
const { eq } = await import("drizzle-orm");
const argon2 = (await import("argon2")).default;
const { AdminAuthService } = await import("../../src/services/admin.services.js");

// Duplique volontairement AdminAuthService.hashResetToken (non exportée) :
// même principe que le commentaire dans admin.services.ts, trop petit pour
// justifier un export juste pour les tests.
function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function resetAdminCredentials(): Promise<void> {
  await testDb.delete(adminCredentials);
}

async function getAdminRow() {
  const [row] = await testDb
    .select()
    .from(adminCredentials)
    .where(eq(adminCredentials.id, 1))
    .limit(1);
  return row;
}

/** Insère directement une ligne admin_credentials avec un token connu (sans
 * passer par requestPasswordReset, qui ne renvoie jamais le token en clair —
 * seul un email le reçoit). Équivalent, pour ce flux, de la création directe
 * d'utilisateurs via testDb dans tests/helpers/db.ts. */
async function seedAdminWithToken(overrides: {
  passwordHash?: string;
  rawToken?: string;
  expiresAt?: Date;
} = {}): Promise<{ passwordHash: string; rawToken: string }> {
  const passwordHash = overrides.passwordHash ?? (await argon2.hash("InitialAdminPass1"));
  const rawToken = overrides.rawToken ?? crypto.randomBytes(32).toString("hex");
  const expiresAt = overrides.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000);

  await testDb.insert(adminCredentials).values({
    id: 1,
    passwordHash,
    resetTokenHash: hashResetToken(rawToken),
    resetTokenExpiresAt: expiresAt,
  });

  return { passwordHash, rawToken };
}

const originalAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
const originalAdminRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL;

beforeEach(async () => {
  await resetAdminCredentials();
  process.env.ADMIN_PASSWORD_HASH = await argon2.hash("InitialAdminPass1");
  delete process.env.ADMIN_RECOVERY_EMAIL;
  mockSendAdminResetPasswordEmail.mockClear();
});

afterAll(async () => {
  if (originalAdminPasswordHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
  else process.env.ADMIN_PASSWORD_HASH = originalAdminPasswordHash;
  if (originalAdminRecoveryEmail === undefined) delete process.env.ADMIN_RECOVERY_EMAIL;
  else process.env.ADMIN_RECOVERY_EMAIL = originalAdminRecoveryEmail;
  await closeTestDb();
});

describe("AdminAuthService.requestPasswordReset — génération et envoi du token", () => {
  it("bootstrap une ligne admin_credentials à partir de ADMIN_PASSWORD_HASH et génère un token valide (~1h)", async () => {
    await AdminAuthService.requestPasswordReset();

    const row = await getAdminRow();
    expect(row).toBeDefined();
    expect(await argon2.verify(row!.passwordHash, "InitialAdminPass1")).toBe(true);
    expect(row!.resetTokenHash).toMatch(/^[0-9a-f]{64}$/);

    const expiresInMs = row!.resetTokenExpiresAt!.getTime() - Date.now();
    expect(expiresInMs).toBeGreaterThan(55 * 60 * 1000);
    expect(expiresInMs).toBeLessThan(65 * 60 * 1000);
  });

  it("envoie le lien de réinitialisation à ADMIN_RECOVERY_EMAIL quand elle est configurée, avec un token correspondant au hash stocké", async () => {
    process.env.ADMIN_RECOVERY_EMAIL = "admin-recovery@example.com";

    await AdminAuthService.requestPasswordReset();
    // sendAdminResetPasswordEmail est appelée en fire-and-forget (non
    // attendue par requestPasswordReset) : on laisse la microtask se vider.
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockSendAdminResetPasswordEmail).toHaveBeenCalledTimes(1);
    const resetUrl = mockSendAdminResetPasswordEmail.mock.calls[0]![0];
    const token = new URL(resetUrl).searchParams.get("token");
    expect(token).toBeTruthy();

    const row = await getAdminRow();
    expect(hashResetToken(token!)).toBe(row!.resetTokenHash);
  });

  it("délègue l'envoi à sendAdminResetPasswordEmail sans jamais attendre son résultat (le token est déjà en base même si l'email échoue)", async () => {
    // requestPasswordReset() appelle sendAdminResetPasswordEmail sans await
    // (fire-and-forget avec .catch) : la décision d'envoyer réellement — ou
    // pas, si ADMIN_RECOVERY_EMAIL est absent — vit entièrement DANS
    // sendAdminResetPasswordEmail (cf. mail.services.admin.test.ts), pas ici.
    // On vérifie seulement que l'échec de l'appel ne fait jamais échouer la
    // requête de réinitialisation elle-même.
    mockSendAdminResetPasswordEmail.mockRejectedValueOnce(new Error("SMTP down"));

    await expect(AdminAuthService.requestPasswordReset()).resolves.toBeUndefined();
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockSendAdminResetPasswordEmail).toHaveBeenCalledTimes(1);

    const row = await getAdminRow();
    expect(row!.resetTokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("conserve le hash de mot de passe existant et ne fait que renouveler le token si une ligne existe déjà", async () => {
    const { passwordHash, rawToken: oldToken } = await seedAdminWithToken();

    await AdminAuthService.requestPasswordReset();

    const row = await getAdminRow();
    expect(row!.passwordHash).toBe(passwordHash);
    expect(row!.resetTokenHash).not.toBe(hashResetToken(oldToken));
  });

  it("échoue avec NO_PASSWORD_CONFIGURED si aucun mot de passe n'est configuré ni en base ni via l'env", async () => {
    delete process.env.ADMIN_PASSWORD_HASH;

    await expect(AdminAuthService.requestPasswordReset()).rejects.toMatchObject({
      code: "NO_PASSWORD_CONFIGURED",
      statusCode: 500,
    });
  });
});

describe("AdminAuthService.resetPassword — validation et consommation du token", () => {
  it("réinitialise le mot de passe avec un token valide puis invalide le token (usage unique)", async () => {
    const { rawToken } = await seedAdminWithToken();

    await AdminAuthService.resetPassword(rawToken, "NewAdminPass123");

    const row = await getAdminRow();
    expect(await argon2.verify(row!.passwordHash, "NewAdminPass123")).toBe(true);
    expect(row!.resetTokenHash).toBeNull();
    expect(row!.resetTokenExpiresAt).toBeNull();

    await expect(AdminAuthService.resetPassword(rawToken, "AnotherPass123")).rejects.toMatchObject({
      code: "INVALID_OR_EXPIRED_TOKEN",
      statusCode: 400,
    });
  });

  it("rejette un token inconnu", async () => {
    await seedAdminWithToken();

    await expect(
      AdminAuthService.resetPassword("token-jamais-emis", "NewAdminPass123")
    ).rejects.toMatchObject({ code: "INVALID_OR_EXPIRED_TOKEN", statusCode: 400 });

    const row = await getAdminRow();
    expect(await argon2.verify(row!.passwordHash, "InitialAdminPass1")).toBe(true);
  });

  it("rejette un token expiré", async () => {
    const { rawToken } = await seedAdminWithToken({
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    await expect(AdminAuthService.resetPassword(rawToken, "NewAdminPass123")).rejects.toMatchObject({
      code: "INVALID_OR_EXPIRED_TOKEN",
      statusCode: 400,
    });
  });

  it("rejette un mot de passe trop court (< 8 caractères)", async () => {
    const { rawToken } = await seedAdminWithToken();

    await expect(AdminAuthService.resetPassword(rawToken, "short")).rejects.toMatchObject({
      code: "WEAK_PASSWORD",
      statusCode: 400,
    });
  });
});

describe("Connexion admin après réinitialisation", () => {
  it("permet la connexion avec le nouveau mot de passe et rejette l'ancien", async () => {
    const { rawToken } = await seedAdminWithToken();
    await AdminAuthService.resetPassword(rawToken, "NewAdminPass123");

    const ok = await request(app)
      .post("/api/admin/auth/login")
      .send({ password: "NewAdminPass123" });
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);
    expect(ok.body.token).toEqual(expect.any(String));

    const stale = await request(app)
      .post("/api/admin/auth/login")
      .send({ password: "InitialAdminPass1" });
    expect(stale.status).toBe(401);
    expect(stale.body.code).toBe("INVALID_PASSWORD");
  });
});

// Ces deux tests sont les seuls de tout le fichier à appeler forgot/reset
// via HTTP : adminForgotPasswordLimiter et adminResetPasswordLimiter sont
// des limiteurs en mémoire partagés par IP (pas de keyGenerator email, cf.
// rateLimit.middleware.ts) — un seul test par endpoint pour ne jamais fausser
// le compte de requêtes, même convention que "Rate limiting" dans
// auth.test.ts.
describe("Rate limiting — forgot/reset password (admin)", () => {
  it("bloque après 5 demandes de réinitialisation depuis la même IP (429)", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/admin/auth/forgot-password").send();
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post("/api/admin/auth/forgot-password").send();
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });
  });

  it("bloque après 20 tentatives de réinitialisation depuis la même IP (429)", async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .post("/api/admin/auth/reset-password")
        .send({ token: `invalid-token-${i}`, password: "NewAdminPass123" });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
    }

    const blocked = await request(app)
      .post("/api/admin/auth/reset-password")
      .send({ token: "invalid-token-21", password: "NewAdminPass123" });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, code: "TOO_MANY_REQUESTS" });
  });
});
