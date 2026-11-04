import type { TerritoryBrand } from "../territory.services.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STRAVA_ORANGE = "#FC5200";
const FONT = "font-family: Arial, Helvetica, sans-serif;";

function step(number: number, title: string, text: string): string {
  return `
                  <tr>
                    <td width="40" valign="top" style="padding:0 0 14px;">
                      <div style="width:28px; height:28px; border-radius:14px; background-color:${STRAVA_ORANGE}; color:#FFFFFF; ${FONT} font-size:14px; font-weight:bold; line-height:28px; text-align:center;">${number}</div>
                    </td>
                    <td valign="top" style="padding:0 0 14px;">
                      <p style="margin:0; ${FONT} font-size:15px; font-weight:bold; color:#1F2937;">${title}</p>
                      <p style="margin:2px 0 0; ${FONT} font-size:14px; line-height:1.5; color:#5B6270;">${text}</p>
                    </td>
                  </tr>`;
}

export function stravaLinkedEmailTemplate(
  pseudo: string,
  brand: TerritoryBrand,
  options: { profileUrl: string; athleteName: string | null },
): string {
  const name = escapeHtml(pseudo);
  const brandName = escapeHtml(brand.brandName);
  const profileUrl = escapeHtml(options.profileUrl);
  const athlete = options.athleteName ? escapeHtml(options.athleteName) : null;

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  </head>
  <body style="margin:0; padding:0; background-color:#F5F5F5; ${FONT}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#FFF7EB; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(31,41,55,0.08);">
            <tr>
              <td style="background-color:#EF4B2D; background-image:linear-gradient(90deg, #E6392E 0%, #EF4B2D 35%, #F66A1A 70%, #F4A61D 100%); padding:28px 24px; text-align:center;" bgcolor="#EF4B2D">
                <!--[if mso]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:480px;height:56px;">
                  <v:fill type="gradient" color="#E6392E" color2="#F4A61D" angle="90" />
                  <v:textbox inset="0,0,0,0">
                <![endif]-->
                <span style="${FONT} font-size:20px; font-weight:bold; color:#FFFFFF; letter-spacing:0.5px;">
                  ${brandName} <span style="color:#FFFFFF; opacity:0.8;">×</span> Strava
                </span>
                <!--[if mso]>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 4px;">
                <h1 style="margin:0 0 16px; ${FONT} font-size:22px; color:#1F2937;">
                  Ton compte Strava est relié ✅
                </h1>
                <p style="margin:0 0 16px; ${FONT} font-size:15px; line-height:1.6; color:#1F2937;">
                  Bonne nouvelle ${name} : ton compte ${brandName} est maintenant connecté à Strava${athlete ? ` (<strong>${athlete}</strong>)` : ""}. Tes rencontres sportives vont pouvoir laisser une trace sur tes activités.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;">
                <p style="margin:0 0 14px; ${FONT} font-size:13px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:${STRAVA_ORANGE};">
                  Comment ça marche
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${step(1, "Pars en sortie", `Rejoins ou organise une activité sur ${brandName} et enregistre-la sur Strava comme d'habitude.`)}
                  ${step(2, "Valide votre rencontre", "Après la sortie, ouvre l'activité et appuie sur « Valider notre rencontre ».")}
                  ${step(3, "Ton activité est mise à jour", "Elle est renommée avec tes partenaires de sortie, et une petite mention est ajoutée à sa description.")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:1px solid #EFE7DA; border-left:4px solid ${STRAVA_ORANGE}; border-radius:12px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="margin:0 0 4px; ${FONT} font-size:12px; color:#8A909B;">Par exemple, sur Strava :</p>
                      <p style="margin:0; ${FONT} font-size:16px; font-weight:bold; color:#1F2937;">Sortie trail avec Léa et Tom</p>
                      <p style="margin:4px 0 0; ${FONT} font-size:14px; color:#5B6270;">Rencontre réussie grâce à ${brandName} ! 🤝</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px; text-align:center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${profileUrl}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="#EF4B2D">
                  <v:fill type="gradient" color="#E6392E" color2="#F4A61D" angle="90" />
                  <w:anchorlock/>
                  <center style="color:#ffffff;${FONT}font-size:15px;font-weight:bold;">
                    Voir mon profil
                  </center>
                </v:roundrect>
                <![endif]-->

                <!--[if !mso]><!-- -->
                <a href="${profileUrl}"
                   style="display:inline-block; padding:12px 32px; border-radius:30px; background-color:#EF4B2D; background-image:linear-gradient(90deg, #E6392E 0%, #EF4B2D 35%, #F66A1A 70%, #F4A61D 100%); color:#FFFFFF; ${FONT} font-size:15px; font-weight:bold; text-decoration:none;">
                  Voir mon profil
                </a>
                <!--<![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="margin:0; ${FONT} font-size:13px; line-height:1.6; color:#5B6270;">
                  Rien n'est jamais modifié sur Strava sans ton action. Tu peux délier Strava à tout moment depuis ton profil.
                  Ce n'est pas toi qui as relié ce compte ? Délie-le depuis ton profil et change ton mot de passe.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; border-top:1px solid #E6E6E6; text-align:center;">
                <p style="margin:0; ${FONT} font-size:12px; color:#1F2937;">
                  Une question ? Écris-nous à
                  <a href="mailto:contact@66partners.fr" style="color:#1F2937;">contact@66partners.fr</a>
                </p>
                <p style="margin:8px 0 0; ${FONT} font-size:12px; color:#1F2937;">
                  © ${new Date().getFullYear()} ${brandName}${brand.territoryName ? ` — ${escapeHtml(brand.territoryName)}` : ""}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
