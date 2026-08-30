export function resetPasswordEmailTemplate(pseudo: string, resetUrl: string): string {
  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  </head>
  <body style="margin:0; padding:0; background-color:#F5F5F5; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#FFF7EB; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(31,41,55,0.08);">
            <tr>
              <!-- Header with gradient fallback and Outlook VML -->
              <td style="background-color:#EF4B2D; background-image:linear-gradient(90deg, #E6392E 0%, #EF4B2D 35%, #F66A1A 70%, #F4A61D 100%); padding:28px 24px; text-align:center;" bgcolor="#EF4B2D">
                <!--[if mso]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:480px;height:56px;">
                  <v:fill type="gradient" color="#E6392E" color2="#F4A61D" angle="90" />
                  <v:textbox inset="0,0,0,0">
                <![endif]-->
                <span style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:bold; color:#FFFFFF; letter-spacing:0.5px;">
                  66Partners
                </span>
                <!--[if mso]>
                  </v:textbox>
                </v:rect>
                <![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;">
                <h1 style="margin:0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size:22px; color:#1F2937;">
                  Réinitialise ton mot de passe
                </h1>
                <p style="margin:0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#1F2937;">
                  Bonjour ${pseudo}, tu as demandé à réinitialiser le mot de passe de ton compte <strong>66Partners</strong>. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.
                </p>
                <p style="margin:0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#6b7280;">
                  Ce lien est valable 1 heure. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email : ton mot de passe restera inchangé.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 32px; text-align:center;">
                <!-- Button with gradient fallback and Outlook VML -->
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="#EF4B2D">
                  <v:fill type="gradient" color="#E6392E" color2="#F4A61D" angle="90" />
                  <w:anchorlock/>
                  <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:15px;font-weight:bold;">
                    Choisir un nouveau mot de passe
                  </center>
                </v:roundrect>
                <![endif]-->

                <!--[if !mso]><!-- -->
                <a href="${resetUrl}"
                   style="display:inline-block; padding:12px 32px; border-radius:30px; background-color:#EF4B2D; background-image:linear-gradient(90deg, #E6392E 0%, #EF4B2D 35%, #F66A1A 70%, #F4A61D 100%); color:#FFFFFF; font-family: Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; text-decoration:none;">
                  Choisir un nouveau mot de passe
                </a>
                <!--<![endif]-->
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; border-top:1px solid #E6E6E6; text-align:center;">
                <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#1F2937;">
                  Une question ? Écris-nous à
                  <a href="mailto:contact@66partners.fr" style="color:#1F2937;">contact@66partners.fr</a>
                </p>
                <p style="margin:8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#1F2937;">
                  © ${new Date().getFullYear()} 66Partners — Pyrénées-Orientales
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
