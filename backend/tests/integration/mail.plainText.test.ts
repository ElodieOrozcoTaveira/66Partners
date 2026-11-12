import { jest } from "@jest/globals";

const mockSendMail = jest.fn<(options: unknown) => Promise<unknown>>().mockResolvedValue(undefined);

// Même pattern que mail.services.admin.test.ts : nodemailer mocké avant l'import.
jest.unstable_mockModule("nodemailer", () => ({
  default: {
    createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
  },
}));

const { sendVerifyEmail, sendContactEmail } = await import("../../src/services/mail.services.js");
const { htmlToText } = await import("../../src/utils/htmlToText.js");

const testBrand = { brandName: "TestPartners", territoryName: "Test" };
type SentMail = { html: string; text: string };

beforeEach(() => mockSendMail.mockClear());

describe("Version texte brut des emails", () => {
  it("joint une partie texte lisible, avec le lien du bouton et sans le code Outlook", async () => {
    await sendVerifyEmail(
      { email: "a@example.com", pseudo: "Léa & Tom" },
      "https://example.com/verifier-email?token=abc&x=1",
      testBrand as never,
    );
    const mail = mockSendMail.mock.calls[0]![0] as SentMail;
    expect(mail.html).toContain("<a href=");
    expect(mail.text).toContain("Bienvenue Léa & Tom");
    expect(mail.text).toContain("Confirmer mon adresse : https://example.com/verifier-email?token=abc&x=1");
    expect(mail.text).toContain("contact@66partners.fr");
    expect(mail.text).not.toMatch(/<|v:roundrect|\[if mso\]/);
    // Le bouton n'apparaît qu'une fois (le doublon Outlook est retiré).
    expect(mail.text.match(/Confirmer mon adresse/g)).toHaveLength(1);
  });

  it("échappe le contenu du formulaire de contact dans le HTML et le restitue tel quel en texte", async () => {
    await sendContactEmail({ name: "<b>Bob</b>", email: "bob@example.com", message: "Salut\n<script>x</script>" });
    const mail = mockSendMail.mock.calls[0]![0] as SentMail;
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;b&gt;Bob&lt;/b&gt;");
    expect(mail.text).toContain("Nom : <b>Bob</b>");
    expect(mail.text).toContain("<script>x</script>");
  });

  it("met les numéros d'étape sur la ligne de leur titre et décode les entités", () => {
    expect(htmlToText("<p>1</p><p>Pars en sortie</p><p>&copy; 2026 &#127881;</p>")).toBe("1. Pars en sortie\n\n© 2026 🎉");
  });
});
