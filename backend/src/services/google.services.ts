import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import { SocialAuthError } from "./socialAuthError.js";

/**
 * VÉRIFICATION DU CREDENTIAL GOOGLE (Google Identity Services)
 *
 * Ne fait jamais confiance à un sub/email envoyé tel quel par le frontend :
 * `verifyIdToken` (google-auth-library, librairie officielle) vérifie
 * cryptographiquement la signature, l'expiration et l'issuer du ID token, et
 * l'option `audience` vérifie qu'il a bien été émis pour NOTRE client OAuth
 * (GOOGLE_CLIENT_ID) — sans ça, un ID token valide émis pour une AUTRE
 * application Google pourrait être rejoué ici.
 */

const client = new OAuth2Client();

// Le claim `picture` d'un ID token Google pointe presque toujours vers une
// miniature basse résolution (`=s96-c`, taille par défaut de Google) — c'est
// la cause du flou observé dans l'app, pas une limite de la photo source.
// Google sert la MÊME image (même hébergeur googleusercontent.com, aucune
// requête réseau ni source externe supplémentaire) à une résolution plus
// grande sur simple changement de ce suffixe de taille dans l'URL.
const GOOGLE_AVATAR_SIZE = 400;

function upgradeGooglePictureResolution(pictureUrl: string | undefined): string | undefined {
  if (!pictureUrl) return pictureUrl;
  // Ne remplace que le suffixe de taille Google connu (`=s<n>` ou `=s<n>-c`)
  // en fin d'URL ; si l'URL ne correspond pas à ce format (autre hébergeur,
  // format inattendu), elle est renvoyée telle quelle plutôt que devinée.
  return pictureUrl.replace(/=s\d+(-c)?$/, (_match, crop: string | undefined) =>
    `=s${GOOGLE_AVATAR_SIZE}${crop ?? ""}`
  );
}

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  givenName?: string | undefined;
  familyName?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

export class GoogleAuthError extends SocialAuthError {
  constructor(message: string, code: string = "INVALID_GOOGLE_TOKEN", statusCode: number = 401) {
    super(message, code, statusCode);
    this.name = "GoogleAuthError";
  }
}

/**
 * Vérifie un ID token Google et renvoie le profil vérifié.
 * Ne jamais logger `credential` (c'est un jeton d'identité — cf. audit sécurité).
 */
export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Erreur de configuration serveur, pas une faute de l'appelant — mais on
    // reste volontairement vague côté réponse HTTP (le contrôleur mappe ça
    // en 401 générique) pour ne jamais révéler l'état de la config.
    throw new GoogleAuthError(
      "Connexion Google indisponible pour le moment.",
      "GOOGLE_NOT_CONFIGURED",
      503
    );
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new GoogleAuthError("Jeton Google invalide ou expiré.");
  }

  if (!payload?.sub || !payload.email) {
    throw new GoogleAuthError("Jeton Google invalide.");
  }

  if (!payload.email_verified) {
    throw new GoogleAuthError(
      "L'adresse email de ce compte Google n'est pas vérifiée.",
      "GOOGLE_EMAIL_NOT_VERIFIED"
    );
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified,
    givenName: payload.given_name,
    familyName: payload.family_name,
    name: payload.name,
    picture: upgradeGooglePictureResolution(payload.picture),
  };
}
