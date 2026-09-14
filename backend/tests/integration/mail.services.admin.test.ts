import { jest } from "@jest/globals";

const mockSendMail = jest.fn<(options: unknown) => Promise<unknown>>().mockResolvedValue(undefined);

// nodemailer est mocké AVANT l'import de mail.services.ts : aucune
// credential SMTP réelle n'existe en environnement de test (cf. .env.test),
// même pattern que le mock de google-auth-library dans
// auth.google.test.ts. Seule sendAdminResetPasswordEmail est exercée ici ;
// c'est la fonction réelle (non mockée) qui est testée, contrairement à
// admin.auth.test.ts où mail.services.ts est mocké dans son ensemble.
jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
  },
}));

const { sendAdminResetPasswordEmail } = await import("../../src/services/mail.services.js");

const originalAdminRecoveryEmail = process.env.ADMIN_RECOVERY_EMAIL;

beforeEach(() => {
  mockSendMail.mockClear();
});

afterAll(() => {
  if (originalAdminRecoveryEmail === undefined) delete process.env.ADMIN_RECOVERY_EMAIL;
  else process.env.ADMIN_RECOVERY_EMAIL = originalAdminRecoveryEmail;
});

describe("sendAdminResetPasswordEmail — adresse de destination fixe (ADMIN_RECOVERY_EMAIL)", () => {
  it("envoie l'email à ADMIN_RECOVERY_EMAIL quand elle est configurée (adresse autorisée)", async () => {
    process.env.ADMIN_RECOVERY_EMAIL = "admin-recovery@example.com";

    await sendAdminResetPasswordEmail("https://example.com/admin/reinitialiser-mot-de-passe?token=abc123");

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0]![0] as { to: string; subject: string; html: string };
    expect(call.to).toBe("admin-recovery@example.com");
    expect(call.html).toContain("abc123");
  });

  it("n'envoie rien quand ADMIN_RECOVERY_EMAIL n'est pas configurée (aucune adresse fournie par l'appelant, pas d'énumération possible)", async () => {
    delete process.env.ADMIN_RECOVERY_EMAIL;

    await expect(
      sendAdminResetPasswordEmail("https://example.com/admin/reinitialiser-mot-de-passe?token=abc123")
    ).resolves.toBeUndefined();

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
