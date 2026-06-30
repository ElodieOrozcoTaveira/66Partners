import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sportLevelEnum, sports, userSports, users } from "../db/schema.js";
const db = drizzle(process.env.DATABASE_URL);
// Erreurs métier personnalisées
export class UserError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "UserError";
    }
}
function toProfile(user) {
    return {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
        city: user.city,
        bio: user.bio,
        avatar: user.avatar,
        latitude: user.latitude,
        longitude: user.longitude,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
export class UserService {
    /**
     * Récupération du profil d'un utilisateur par son ID
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
        return toProfile(user);
    }
    /**
     * Mise à jour du profil d'un utilisateur
     */
    static async updateUser(userId, data) {
        const [updatedUser] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();
        if (!updatedUser) {
            throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
        }
        return toProfile(updatedUser);
    }
    /**
     * Suppression d'un utilisateur
     */
    static async deleteUser(userId) {
        const deletedRows = await db
            .delete(users)
            .where(eq(users.id, userId))
            .returning({ id: users.id });
        if (deletedRows.length === 0) {
            throw new UserError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
        }
    }
    /**
     * Liste des sports pratiqués par un utilisateur, avec leur niveau
     */
    static async listUserSports(userId) {
        const rows = await db
            .select({
            sportId: userSports.sportId,
            sportName: sports.name,
            level: userSports.level,
        })
            .from(userSports)
            .innerJoin(sports, eq(userSports.sportId, sports.id))
            .where(eq(userSports.userId, userId));
        return rows;
    }
    /**
     * Ajout ou mise à jour du niveau d'un sport pratiqué par l'utilisateur
     */
    static async setUserSport(userId, sportId, level) {
        const [sport] = await db
            .select({ id: sports.id, name: sports.name })
            .from(sports)
            .where(eq(sports.id, sportId))
            .limit(1);
        if (!sport) {
            throw new UserError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
        }
        await db
            .insert(userSports)
            .values({ userId, sportId, level })
            .onConflictDoUpdate({
            target: [userSports.userId, userSports.sportId],
            set: { level },
        });
        return { sportId: sport.id, sportName: sport.name, level };
    }
    /**
     * Retrait d'un sport pratiqué par l'utilisateur
     */
    static async removeUserSport(userId, sportId) {
        const deletedRows = await db
            .delete(userSports)
            .where(and(eq(userSports.userId, userId), eq(userSports.sportId, sportId)))
            .returning({ sportId: userSports.sportId });
        if (deletedRows.length === 0) {
            throw new UserError("Ce sport n'est pas associé à cet utilisateur", "USER_SPORT_NOT_FOUND", 404);
        }
    }
}
//# sourceMappingURL=user.services.js.map