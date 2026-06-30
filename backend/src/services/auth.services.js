import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import argon2 from "argon2";
import { users } from "../db/schema.js";
const db = drizzle(process.env.DATABASE_URL);
const PASSWORD_MIN_LENGTH = 8;
function isPasswordStrong(password) {
    return password.length >= PASSWORD_MIN_LENGTH;
}
// Erreurs métier personnalisées
export class AuthError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "AuthError";
    }
}
export class AuthService {
    /**
     * Inscription d'un nouvel utilisateur
     */
    static async registerUser(userData) {
        const { pseudo, email, password, city, bio, avatar } = userData;
        // 1. Validation de l'email unique
        const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);
        if (existingUser) {
            throw new AuthError("Un utilisateur avec cet email existe déjà", "USER_ALREADY_EXISTS", 409);
        }
        // 2. Validation des règles métier du mot de passe
        if (!isPasswordStrong(password)) {
            throw new AuthError("Le mot de passe ne respecte pas les critères de sécurité", "WEAK_PASSWORD", 400);
        }
        // 3. Hachage sécurisé du mot de passe
        const hashedPassword = await argon2.hash(password);
        // 4. Création de l'utilisateur
        const [newUser] = await db
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
        if (!newUser) {
            throw new AuthError("Erreur lors de la création de l'utilisateur", "USER_CREATION_FAILED", 500);
        }
        // 5. Retour des données utilisateur (sans le mot de passe)
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
    static async authenticateUser(credentials) {
        const { email, password } = credentials;
        // 1. Recherche de l'utilisateur par email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()))
            .limit(1);
        if (!user) {
            // Message volontairement vague pour la sécurité
            throw new AuthError("Email ou mot de passe incorrect", "INVALID_CREDENTIALS", 401);
        }
        // 2. Vérification du mot de passe
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            // Message volontairement vague pour la sécurité
            throw new AuthError("Email ou mot de passe incorrect", "INVALID_CREDENTIALS", 401);
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
    static async getUserById(userId) {
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
    static async checkEmailExists(email) {
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
    static async updateUserPassword(userId, newPassword) {
        // 1. Validation du mot de passe
        if (!isPasswordStrong(newPassword)) {
            throw new AuthError("Le nouveau mot de passe ne respecte pas les critères de sécurité", "WEAK_PASSWORD", 400);
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
}
//# sourceMappingURL=auth.services.js.map