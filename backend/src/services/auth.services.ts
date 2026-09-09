import "dotenv/config";
import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import argon2 from "argon2";
import { users } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";
import { sendWelcomeEmail, sendResetPasswordEmail } from "./mail.services.js";
import { TerritoryService } from "./territory.services.js";
import { SocialAccountService, type SocialProvider } from "./socialAccount.services.js";
import type { GoogleProfile } from "./google.services.js";
import type { FacebookProfile } from "./facebook.services.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE D'AUTHENTIFICATION
 *
 * Contient toute la logique métier liée à l'authentification
 * Indépendant du protocole HTTP (réutilisable partout)
 */

// Types pour les données utilisateur
export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegistration {
  pseudo: string;
  email: string;
  password: string;
  city?: string;
  avatar?: string;
  termsAccepted: true;
}

export interface UserData {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  headline: string | null;
  lookingFor: string | null;
  openTo: string | null;
  avatar: string | null;
  createdAt: Date;
}

const PASSWORD_MIN_LENGTH = 8;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

function isPasswordStrong(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

function derivePseudoFromGoogleProfile(profile: GoogleProfile): string {
  const base = profile.givenName || profile.name || profile.email.split("@")[0] || "Sportif";
  return base.slice(0, 100);
}

function derivePseudoFromFacebookProfile(profile: FacebookProfile): string {
  const base = profile.firstName || profile.name || profile.email.split("@")[0] || "Sportif";
  return base.slice(0, 100);
}

// État métier renvoyé par POST /api/auth/{google,facebook} — jamais de
// création ni de fusion à ce stade, uniquement un constat sur l'état du
// compte :
// - LOGGED_IN : ce compte social est déjà lié à un utilisateur 66Partners.
// - NEW_ACCOUNT : ni le compte social ni l'email ne sont connus — le
//   frontend doit faire accepter les CGU avant d'appeler .../complete.
// - EMAIL_ALREADY_REGISTERED : un compte 66Partners existe déjà avec cet
//   email mais sans ce provider lié — jamais de fusion automatique, le
//   frontend doit faire passer l'utilisateur par un login mot de passe
//   classique avant d'appeler .../link.
export type SocialLoginStatus =
  | { status: "LOGGED_IN"; user: UserData }
  | { status: "NEW_ACCOUNT"; email: string }
  | { status: "EMAIL_ALREADY_REGISTERED"; email: string };

// Conservé pour compatibilité de nommage avec le code existant (Google a été
// implémenté avant que Facebook ne généralise ce type).
export type GoogleLoginStatus = SocialLoginStatus;

interface SocialIdentity {
  providerUserId: string;
  email: string;
  pseudo: string;
  avatar?: string | undefined;
}

// Le token brut part par email ; seul son hash est conservé en base
// (comme pour un mot de passe : une fuite de la base ne permet pas de le rejouer).
function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Erreurs métier personnalisées
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async registerUser(userData: UserRegistration): Promise<UserData> {
    const { pseudo, email, password, city, avatar } = userData;

    // 1. Validation de l'email unique
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      throw new AuthError(
        "Un utilisateur avec cet email existe déjà",
        "USER_ALREADY_EXISTS",
        409
      );
    }

    // 2. Validation des règles métier du mot de passe
    if (!isPasswordStrong(password)) {
      throw new AuthError(
        "Le mot de passe ne respecte pas les critères de sécurité",
        "WEAK_PASSWORD",
        400
      );
    }

    // 3. Hachage sécurisé du mot de passe
    const hashedPassword = await argon2.hash(password);

    // 4. Création de l'utilisateur
    let newUser: typeof users.$inferSelect | undefined;
    try {
      [newUser] = await db
        .insert(users)
        .values({
          pseudo,
          email: email.toLowerCase(),
          password: hashedPassword,
          city,
          avatar,
          // La validation Zod (registerSchema) a déjà refusé toute valeur
          // autre que `true` avant d'arriver ici — cf. P1 audit RGPD.
          termsAcceptedAt: new Date(),
        })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthError(
          "Un utilisateur avec cet email existe déjà",
          "USER_ALREADY_EXISTS",
          409
        );
      }
      throw error;
    }

    if (!newUser) {
      throw new AuthError(
        "Erreur lors de la création de l'utilisateur",
        "USER_CREATION_FAILED",
        500
      );
    }

    // 5. Rattachement aux territoires actuellement actifs (ex : le 66).
    // Uniquement à l'inscription — un futur territoire qui devient actif ne
    // rattache jamais rétroactivement les comptes déjà existants.
    await TerritoryService.attachUserToActiveTerritories(newUser.id);

    // 6. Email de bienvenue (non bloquant)
    sendWelcomeEmail(newUser).catch((err) =>
      console.error("Erreur envoi email de bienvenue:", err),
    );

    // 7. Retour des données utilisateur (sans le mot de passe)
    return {
      id: newUser.id,
      email: newUser.email,
      pseudo: newUser.pseudo,
      city: newUser.city,
      headline: newUser.headline,
      lookingFor: newUser.lookingFor,
      openTo: newUser.openTo,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Authentification d'un utilisateur
   */
  static async authenticateUser(credentials: UserLogin): Promise<UserData> {
    const { email, password } = credentials;

    // 1. Recherche de l'utilisateur par email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Message volontairement vague pour la sécurité
      throw new AuthError(
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
        401
      );
    }

    // 2. Vérification du mot de passe — un compte créé uniquement via Google
    // n'a pas de mot de passe (password null) : traité comme des identifiants
    // invalides, jamais comme une erreur serveur.
    if (!user.password) {
      throw new AuthError(
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
        401
      );
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      // Message volontairement vague pour la sécurité
      throw new AuthError(
        "Email ou mot de passe incorrect",
        "INVALID_CREDENTIALS",
        401
      );
    }

    // 3. Retour des données utilisateur authentifié
    return {
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      city: user.city,
      headline: user.headline,
      lookingFor: user.lookingFor,
      openTo: user.openTo,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * Récupération des informations utilisateur par ID
   */
  static async getUserById(userId: string): Promise<UserData | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      city: user.city,
      headline: user.headline,
      lookingFor: user.lookingFor,
      openTo: user.openTo,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * Validation d'existence d'un email
   */
  static async checkEmailExists(email: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return !!user;
  }

  /**
   * Mise à jour du mot de passe d'un utilisateur
   */
  static async updateUserPassword(
    userId: string,
    newPassword: string
  ): Promise<void> {
    // 1. Validation du mot de passe
    if (!isPasswordStrong(newPassword)) {
      throw new AuthError(
        "Le nouveau mot de passe ne respecte pas les critères de sécurité",
        "WEAK_PASSWORD",
        400
      );
    }

    // 2. Hachage du nouveau mot de passe
    const hashedPassword = await argon2.hash(newPassword);

    // 3. Mise à jour en base
    const updatedRows = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (updatedRows.length === 0) {
      throw new AuthError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }
  }

  /**
   * Demande de réinitialisation de mot de passe.
   * Ne révèle jamais si l'email correspond à un compte existant (anti-énumération) :
   * on retourne toujours normalement, l'email n'est envoyé que si un compte existe.
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const [user] = await db
      .select({ id: users.id, email: users.email, pseudo: users.pseudo })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db
      .update(users)
      .set({ resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: expiresAt })
      .where(eq(users.id, user.id));

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reinitialiser-mot-de-passe?token=${rawToken}`;

    sendResetPasswordEmail(user, resetUrl).catch((err) =>
      console.error("Erreur envoi email de réinitialisation:", err),
    );
  }

  /**
   * Finalise une réinitialisation de mot de passe à partir du token reçu par email.
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!isPasswordStrong(newPassword)) {
      throw new AuthError(
        "Le mot de passe ne respecte pas les critères de sécurité",
        "WEAK_PASSWORD",
        400
      );
    }

    const tokenHash = hashResetToken(token);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.resetPasswordTokenHash, tokenHash),
          gt(users.resetPasswordExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!user) {
      throw new AuthError(
        "Ce lien de réinitialisation est invalide ou a expiré",
        "INVALID_OR_EXPIRED_TOKEN",
        400
      );
    }

    const hashedPassword = await argon2.hash(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  /**
   * Constate l'état d'un compte pour un fournisseur social donné — ne crée
   * et ne fusionne jamais rien. Partagé par Google et Facebook : la logique
   * est strictement identique une fois `providerUserId`/`email` vérifiés
   * cryptographiquement par le service du provider concerné.
   */
  private static async loginWithSocialAccount(
    provider: SocialProvider,
    providerUserId: string,
    email: string
  ): Promise<SocialLoginStatus> {
    const linkedUserId = await SocialAccountService.findUserIdByProvider(
      provider,
      providerUserId
    );

    if (linkedUserId) {
      const user = await AuthService.getUserById(linkedUserId);
      if (!user) {
        // Ligne social_accounts orpheline (ne devrait pas arriver, la FK est
        // en cascade) — on retombe sur un état sûr plutôt que de planter.
        throw new AuthError("Utilisateur introuvable", "USER_NOT_FOUND", 404);
      }
      return { status: "LOGGED_IN", user };
    }

    const emailTaken = await AuthService.checkEmailExists(email);
    if (emailTaken) {
      return { status: "EMAIL_ALREADY_REGISTERED", email };
    }

    return { status: "NEW_ACCOUNT", email };
  }

  /**
   * Seule voie de création d'un compte via un fournisseur social.
   * `termsAccepted` est déjà revalidé à `true` par Zod avant d'arriver ici
   * (même garde-fou que registerUser) : jamais de termsAcceptedAt simplement
   * parce qu'un provider externe a authentifié la personne.
   */
  private static async completeSocialSignup(
    provider: SocialProvider,
    identity: SocialIdentity
  ): Promise<UserData> {
    // Idempotence : un double-clic/double-soumission sur le même token
    // ne doit pas tenter de recréer le compte une seconde fois.
    const alreadyLinkedUserId = await SocialAccountService.findUserIdByProvider(
      provider,
      identity.providerUserId
    );
    if (alreadyLinkedUserId) {
      const existing = await AuthService.getUserById(alreadyLinkedUserId);
      if (existing) return existing;
    }

    const emailTaken = await AuthService.checkEmailExists(identity.email);
    if (emailTaken) {
      // Quelqu'un a créé/lié ce compte entre le premier constat et
      // celui-ci : jamais de fusion silencieuse, même ici.
      throw new AuthError(
        "Un compte existe déjà avec cette adresse email. Connecte-toi puis associe ce compte depuis ton profil.",
        "EMAIL_ALREADY_REGISTERED",
        409
      );
    }

    let newUser: typeof users.$inferSelect | undefined;
    try {
      [newUser] = await db
        .insert(users)
        .values({
          pseudo: identity.pseudo,
          email: identity.email,
          password: null,
          avatar: identity.avatar,
          termsAcceptedAt: new Date(),
        })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthError(
          "Un compte existe déjà avec cette adresse email.",
          "EMAIL_ALREADY_REGISTERED",
          409
        );
      }
      throw error;
    }

    if (!newUser) {
      throw new AuthError(
        "Erreur lors de la création de l'utilisateur",
        "USER_CREATION_FAILED",
        500
      );
    }

    // Même rattachement territorial que l'inscription classique (§ registerUser).
    await TerritoryService.attachUserToActiveTerritories(newUser.id);

    await SocialAccountService.link({
      userId: newUser.id,
      provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
    });

    sendWelcomeEmail(newUser).catch((err) =>
      console.error("Erreur envoi email de bienvenue:", err),
    );

    return {
      id: newUser.id,
      email: newUser.email,
      pseudo: newUser.pseudo,
      city: newUser.city,
      headline: newUser.headline,
      lookingFor: newUser.lookingFor,
      openTo: newUser.openTo,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Associe un fournisseur social à un compte 66Partners déjà authentifié
   * par mot de passe (requireAuth, req.userId). C'est la seule voie
   * d'association : jamais de fusion automatique par email seul.
   */
  private static async linkSocialAccount(
    userId: string,
    provider: SocialProvider,
    providerUserId: string,
    email: string
  ): Promise<void> {
    const linkedUserId = await SocialAccountService.findUserIdByProvider(
      provider,
      providerUserId
    );

    if (linkedUserId && linkedUserId !== userId) {
      throw new AuthError(
        `Ce compte ${provider === "google" ? "Google" : "Facebook"} est déjà associé à un autre compte 66Partners.`,
        `${provider.toUpperCase()}_ACCOUNT_ALREADY_LINKED`,
        409
      );
    }

    // Idempotent : déjà lié à ce même utilisateur, rien à faire.
    if (linkedUserId === userId) return;

    const user = await AuthService.getUserById(userId);
    if (!user) {
      throw new AuthError("Utilisateur introuvable", "USER_NOT_FOUND", 404);
    }

    await SocialAccountService.link({ userId, provider, providerUserId, email });
  }

  // ─── Google ────────────────────────────────────────────────────────────

  /**
   * POST /api/auth/google — `profile` a déjà été vérifié cryptographiquement
   * par verifyGoogleCredential() avant d'arriver ici.
   */
  static async loginWithGoogle(profile: GoogleProfile): Promise<GoogleLoginStatus> {
    return AuthService.loginWithSocialAccount("google", profile.sub, profile.email);
  }

  static async completeGoogleSignup(
    profile: GoogleProfile,
    // Type volontairement restreint au littéral `true` : impossible d'appeler
    // cette méthode sans avoir déjà une acceptation explicite des CGU.
    _termsAccepted: true
  ): Promise<UserData> {
    return AuthService.completeSocialSignup("google", {
      providerUserId: profile.sub,
      email: profile.email,
      pseudo: derivePseudoFromGoogleProfile(profile),
      avatar: profile.picture,
    });
  }

  static async linkGoogleAccount(userId: string, profile: GoogleProfile): Promise<void> {
    return AuthService.linkSocialAccount(userId, "google", profile.sub, profile.email);
  }

  // ─── Facebook ──────────────────────────────────────────────────────────

  /**
   * POST /api/auth/facebook — `profile` a déjà été vérifié par
   * verifyFacebookAccessToken() (Graph API /debug_token + /me) avant
   * d'arriver ici.
   */
  static async loginWithFacebook(profile: FacebookProfile): Promise<SocialLoginStatus> {
    return AuthService.loginWithSocialAccount("facebook", profile.id, profile.email);
  }

  static async completeFacebookSignup(
    profile: FacebookProfile,
    _termsAccepted: true
  ): Promise<UserData> {
    return AuthService.completeSocialSignup("facebook", {
      providerUserId: profile.id,
      email: profile.email,
      pseudo: derivePseudoFromFacebookProfile(profile),
      avatar: profile.picture,
    });
  }

  static async linkFacebookAccount(userId: string, profile: FacebookProfile): Promise<void> {
    return AuthService.linkSocialAccount(userId, "facebook", profile.id, profile.email);
  }
}
