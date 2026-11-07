import { jest } from "@jest/globals";

const mockSendVerifyEmail = jest
  .fn<(user: { email: string; pseudo: string }, verifyUrl: string, brand: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);

jest.unstable_mockModule("../../src/services/mail.services.js", () => ({
  sendVerifyEmail: mockSendVerifyEmail,
  sendWelcomeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAdminResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAccountDeletedEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendStravaLinkedEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendContactEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendReportAlertEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const request = (await import("supertest")).default;
const { eq } = await import("drizzle-orm");
const { default: app } = await import("../../src/app.js");
const { users } = await import("../../src/db/schema.js");
const { closeTestDb, createSport, createTerritory, createUser, resetAll, testDb } = await import("../helpers/db.js");

const PASSWORD = "MotDePasse!2026";

async function register(email: string) {
  await createTerritory({ code: "66", slug: "pyrenees-orientales", brandName: "66Partners", isActive: true });
  return request(app).post("/api/auth/register").send({
    pseudo: "Nouvelle",
    email,
    password: PASSWORD,
    termsAccepted: true,
    territoryCode: "66",
  });
}

function tokenFromLastEmail(): string {
  const url = mockSendVerifyEmail.mock.calls.at(-1)![1];
  return new URL(url).searchParams.get("token")!;
}

async function waitForEmail() {
  for (let i = 0; i < 50 && mockSendVerifyEmail.mock.calls.length === 0; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Confirmation de l'adresse email", () => {
  it("envoie un lien à l'inscription et confirme l'adresse avec ce lien", async () => {
    const res = await register("nouvelle@test.com");
    expect(res.status).toBeLessThan(300);
    await waitForEmail();
    expect(mockSendVerifyEmail).toHaveBeenCalledTimes(1);
    expect(mockSendVerifyEmail.mock.calls[0]![1]).toMatch(/\/verifier-email\?token=[0-9a-f]{64}$/);

    const [before] = await testDb.select().from(users).where(eq(users.email, "nouvelle@test.com"));
    expect(before!.emailVerifiedAt).toBeNull();
    expect(before!.emailVerificationTokenHash).not.toContain(tokenFromLastEmail());

    const verified = await request(app).post("/api/auth/verify-email").send({ token: tokenFromLastEmail() });
    expect(verified.status).toBe(200);
    const [after] = await testDb.select().from(users).where(eq(users.email, "nouvelle@test.com"));
    expect(after!.emailVerifiedAt).not.toBeNull();
    expect(after!.emailVerificationTokenHash).toBeNull();

    const again = await request(app).post("/api/auth/verify-email").send({ token: tokenFromLastEmail() });
    expect(again.status).toBe(400);
  });

  it("refuse un lien inconnu ou expiré", async () => {
    const res = await request(app).post("/api/auth/verify-email").send({ token: "a".repeat(64) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_OR_EXPIRED_TOKEN");
  });

  it("indique l'état dans le profil et bloque l'organisation d'une sortie tant que l'adresse n'est pas confirmée", async () => {
    const member = await createUser({ emailVerified: false });
    const me = await request(app).get("/api/users/me").set("Authorization", `Bearer ${member.token}`);
    expect(me.body.user.emailVerified).toBe(false);

    const territory = await createTerritory({ code: "66", slug: "pyrenees-orientales", isActive: true });
    const sportId = await createSport("Running");
    const created = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${member.token}`)
      .send({
        title: "Footing",
        city: "Perpignan",
        startDate: new Date(Date.now() + 86_400_000).toISOString(),
        levelRequired: "BEGINNER",
        maxParticipants: 4,
        sportId,
        territoryId: territory.id,
      });
    expect(created.status).toBe(403);
    expect(created.body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("renvoie un nouveau lien, sauf si l'adresse est déjà confirmée", async () => {
    const pending = await createUser({ emailVerified: false });
    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", `Bearer ${pending.token}`);
    expect(res.body.alreadyVerified).toBe(false);
    expect(mockSendVerifyEmail).toHaveBeenCalledTimes(1);

    const verified = await createUser();
    const res2 = await request(app)
      .post("/api/auth/resend-verification")
      .set("Authorization", `Bearer ${verified.token}`);
    expect(res2.body.alreadyVerified).toBe(true);
    expect(mockSendVerifyEmail).toHaveBeenCalledTimes(1);
  });
});
