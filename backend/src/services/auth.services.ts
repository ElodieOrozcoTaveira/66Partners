import "dotenv/config";
import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import argon2 from "argon2";
import { users } from "../db/schema.js";
import { isUniqueViolation } from "../utils/db-errors.js";
import { sendWelcomeEmail, sendResetPasswordEmail } from "./mail.services.js";

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
  bio?: string;
  avatar?: string;
}

export interface UserData {
  id: string;
  email: string;
  pseudo: string;
  city: string | null;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
}

const PASSWORD_MIN_LENGTH = 8;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

function isPasswordStrong(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
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
    const { pseudo, email, password, city, bio, avatar } = userData;

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
          bio,
          avatar,
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

    // 5. Email de bienvenue (non bloquant)
    sendWelcomeEmail(newUser).catch((err) =>
      console.error("Erreur envoi email de bienvenue:", err),
    );

    // 6. Retour des données utilisateur (sans le mot de passe)
    return {
      id: newUser.id,
      email: newUser.email,
      pseudo: newUser.pseudo,
      city: newUser.city,
      bio: newUser.bio,
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

    // 2. Vérification du mot de passe
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
      bio: user.bio,
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
      bio: user.bio,
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
}
