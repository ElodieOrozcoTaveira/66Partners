import "dotenv/config";
import nodemailer from "nodemailer";
import { welcomeEmailTemplate } from "./emailTemplates/welcome.template.js";
import { resetPasswordEmailTemplate } from "./emailTemplates/resetPassword.template.js";
import { accountDeletedEmailTemplate } from "./emailTemplates/accountDeleted.template.js";
import type { TerritoryBrand } from "./territory.services.js";

const transporter = nodemailer.createTransport({
  host: "ssl0.ovh.net",
  port: 465,
  secure: true,
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
