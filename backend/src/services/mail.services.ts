import "dotenv/config";
import nodemailer from "nodemailer";
import { welcomeEmailTemplate } from "./emailTemplates/welcome.template.js";
import { resetPasswordEmailTemplate } from "./emailTemplates/resetPassword.template.js";
import { accountDeletedEmailTemplate } from "./emailTemplates/accountDeleted.template.js";
import type { TerritoryBrand } from "./territory.services.js";

// Port 587 + STARTTLS obligatoire plutôt que 465 (SSL implicite) : Hetzner
// bloque le port 465 sortant sur le serveur de prod. requireTLS refuse tout
// envoi si le serveur ne propose pas STARTTLS (jamais d'auth en clair).
const transporter = nodemailer.createTransport({
  host: "ssl0.ovh.net",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendWelcomeEmail(
  user: { email: string; pseudo: string },
  brand: TerritoryBrand,
) {
  await transporter.sendMail({
    from: `"${brand.brandName}" <${process.env.SMTP_USER}>`,
    replyTo: "contact@66partners.fr",
    to: user.email,
    subject: `Bienvenue sur ${brand.brandName} 🎉`,
    html: welcomeEmailTemplate(user.pseudo, brand),
  });
}

export async function sendResetPasswordEmail(
  user: { email: string; pseudo: string },
  resetUrl: string,
  brand: TerritoryBrand,
) {
  await transporter.sendMail({
    from: `"${brand.brandName}" <${process.env.SMTP_USER}>`,
    replyTo: "contact@66partners.fr",
    to: user.email,
    subject: `Réinitialise ton mot de passe ${brand.brandName}`,
    html: resetPasswordEmailTemplate(user.pseudo, resetUrl, brand),
  });
}

export async function sendAdminResetPasswordEmail(
  resetUrl: string,
  brand: TerritoryBrand,
): Promise<void> {
  const to = process.env.ADMIN_RECOVERY_EMAIL;
  if (!to) return;

  await transporter.sendMail({
    from: `"${brand.brandName}" <${process.env.SMTP_USER}>`,
    replyTo: "contact@66partners.fr",
    to,
    subject: `Réinitialise le mot de passe administrateur ${brand.brandName}`,
    html: resetPasswordEmailTemplate("Administrateur", resetUrl, brand),
  });
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const REPORT_REASON_LABELS: Record<string, string> = {
  HARASSMENT: "Harcèlement ou insultes",
  INAPPROPRIATE: "Contenu inapproprié",
  SPAM: "Faux profil ou spam",
  DANGEROUS: "Comportement dangereux",
  OTHER: "Autre",
};

const REPORT_CONTEXT_LABELS: Record<string, string> = {
  PROFILE: "un profil",
  MESSAGE: "un message",
  ACTIVITY: "une activité",
  PHOTO: "une photo",
};

/** Alerte l'admin d'un nouveau signalement (à traiter rapidement, exigence des stores). */
export async function sendReportAlertEmail(report: {
  context: string;
  reason: string;
  details: string | null;
  targetExcerpt: string | null;
  reporter: { pseudo: string } | null;
  reportedUser: { pseudo: string; openReports: number } | null;
}): Promise<void> {
  const to = process.env.ADMIN_RECOVERY_EMAIL;
  if (!to) return;

  const adminUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/signalements`;
  const reported = report.reportedUser
    ? `${escapeHtml(report.reportedUser.pseudo)} (${report.reportedUser.openReports} signalement(s) en attente)`
    : "compte supprimé";

  await transporter.sendMail({
    from: `"66Partners" <${process.env.SMTP_USER}>`,
    to,
    subject: `Nouveau signalement : ${REPORT_REASON_LABELS[report.reason] ?? report.reason}`,
    html: `
      <h1>Nouveau signalement</h1>
      <p><strong>Contenu :</strong> ${REPORT_CONTEXT_LABELS[report.context] ?? report.context}</p>
      <p><strong>Motif :</strong> ${REPORT_REASON_LABELS[report.reason] ?? report.reason}</p>
      <p><strong>Membre signalé :</strong> ${reported}</p>
      <p><strong>Signalé par :</strong> ${report.reporter ? escapeHtml(report.reporter.pseudo) : "compte supprimé"}</p>
      ${report.targetExcerpt ? `<p><strong>Contenu signalé :</strong><br>${escapeHtml(report.targetExcerpt).replace(/\n/g, "<br>")}</p>` : ""}
      ${report.details ? `<p><strong>Précisions :</strong><br>${escapeHtml(report.details).replace(/\n/g, "<br>")}</p>` : ""}
      <p><a href="${adminUrl}">Traiter le signalement dans l'espace admin</a></p>
    `,
  });
}

export async function sendAccountDeletedEmail(
  user: { email: string; pseudo: string },
  brand: TerritoryBrand,
) {
  await transporter.sendMail({
    from: `"${brand.brandName}" <${process.env.SMTP_USER}>`,
    replyTo: "contact@66partners.fr",
    to: user.email,
    subject: `Votre compte ${brand.brandName} a été supprimé`,
    html: accountDeletedEmailTemplate(user.pseudo, brand),
  });
}

export async function sendContactEmail(contact: { name: string; email: string; message: string }) {
  await transporter.sendMail({
    from: `"66Partners" <${process.env.SMTP_USER}>`,
    replyTo: contact.email,
    to: "contact@66partners.fr",
    subject: `Nouveau message de contact — ${contact.name}`,
    html: `
      <h1>Nouveau message via le formulaire de contact</h1>
      <p><strong>Nom :</strong> ${contact.name}</p>
      <p><strong>Email :</strong> ${contact.email}</p>
      <p><strong>Message :</strong></p>
      <p>${contact.message.replace(/\n/g, "<br>")}</p>
    `,
  });
}
