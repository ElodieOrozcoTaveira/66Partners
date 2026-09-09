import "dotenv/config";
import { SocialAuthError } from "./socialAuthError.js";

/**
 * VÉRIFICATION DU TOKEN FACEBOOK (Facebook Login for the Web, SDK JS)
 *
 * Le frontend récupère un access token via FB.login() côté navigateur — un
 * jeton opaque, jamais un JWT signé comme celui de Google. On ne lui fait
 * jamais confiance tel quel : deux appels serveur-à-serveur vers Graph API :
 *  1. /debug_token (avec FACEBOOK_APP_ID|FACEBOOK_APP_SECRET) confirme que
 *     le token est valide, non expiré, et émis pour NOTRE app (équivalent
 *     de la vérification `audience` de Google) ;
 *  2. /me récupère le profil (id Facebook stable = provider_user_id).
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface FacebookProfile {
  id: string;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
}

export class FacebookAuthError extends SocialAuthError {
  constructor(message: string, code: string = "INVALID_FACEBOOK_TOKEN", statusCode: number = 401) {
    super(message, code, statusCode);
    this.name = "FacebookAuthError";
  }
}

interface DebugTokenResponse {
  data?: {
    app_id?: string;
    is_valid?: boolean;
    user_id?: string;
    expires_at?: number;
  };
}

interface MeResponse {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  picture?: { data?: { url?: string } };
  error?: { message?: string };
}

/**
 * Vérifie un access token Facebook et renvoie le profil vérifié.
 * Ne jamais logger `accessToken` (c'est un jeton d'accès — cf. audit sécurité Google).
 */
export async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookProfile> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    // Erreur de configuration serveur, pas une faute de l'appelant — reste
    // volontairement vague côté réponse HTTP (mappé en générique par le
    // contrôleur), pour ne jamais révéler l'état de la config.
    throw new FacebookAuthError(
      "Connexion Facebook indisponible pour le moment.",
      "FACEBOOK_NOT_CONFIGURED",
      503
    );
  }

  let debugData: DebugTokenResponse["data"];
  try {
    const debugRes = await fetch(
      `${GRAPH_API_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`
    );
    const debugBody = (await debugRes.json()) as DebugTokenResponse;
    debugData = debugBody.data;
  } catch {
    throw new FacebookAuthError("Jeton Facebook invalide ou expiré.");
  }

  if (!debugData?.is_valid || debugData.app_id !== appId || !debugData.user_id) {
    throw new FacebookAuthError("Jeton Facebook invalide.");
  }

  let profile: MeResponse;
  try {
    const meRes = await fetch(
      // picture.width/height : sans ça, Graph API renvoie une miniature ~50x50
      // (floue une fois affichée en avatar de taille normale).
      `${GRAPH_API_BASE}/me?fields=id,email,first_name,last_name,name,picture.width(400).height(400)&access_token=${encodeURIComponent(accessToken)}`
    );
    profile = (await meRes.json()) as MeResponse;
  } catch {
    throw new FacebookAuthError("Jeton Facebook invalide ou expiré.");
  }

  if (!profile.id || profile.error) {
    throw new FacebookAuthError("Jeton Facebook invalide.");
  }

  if (!profile.email) {
    // Facebook ne garantit jamais l'email (permission refusée ou compte sans
    // email vérifié) — notre système exige un email unique par compte, donc
    // pas de création/connexion possible sans lui.
    throw new FacebookAuthError(
      "Ton compte Facebook ne fournit pas d'adresse email. Utilise un autre moyen de connexion.",
      "FACEBOOK_EMAIL_MISSING",
      422
    );
  }

  return {
    id: profile.id,
    email: profile.email.toLowerCase(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    name: profile.name,
    picture: profile.picture?.data?.url,
  };
}
