import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { sports } from "../db/schema.js";
const db = drizzle(process.env.DATABASE_URL);
// Erreurs métier personnalisées
export class SportError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "SportError";
    }
}
export class SportService {
    /**
     * Liste de tous les sports
     */
    static async listSports() {
        return db.select().from(sports);
    }
    /**
     * Récupération d'un sport par son ID
     */
    static async getSportById(sportId) {
        const [sport] = await db
            .select()
            .from(sports)
            .where(eq(sports.id, sportId))
            .limit(1);
        return sport ?? null;
    }
    /**
     * Création d'un nouveau sport
     */
    static async createSport(data) {
        const [existingSport] = await db
            .select({ id: sports.id })
            .from(sports)
            .where(eq(sports.name, data.name))
            .limit(1);
        if (existingSport) {
            throw new SportError("Un sport avec ce nom existe déjà", "SPORT_ALREADY_EXISTS", 409);
        }
        const [newSport] = await db.insert(sports).values(data).returning();
        if (!newSport) {
            throw new SportError("Erreur lors de la création du sport", "SPORT_CREATION_FAILED", 500);
        }
        return newSport;
    }
    /**
     * Mise à jour d'un sport
     */
    static async updateSport(sportId, data) {
        const [updatedSport] = await db
            .update(sports)
            .set(data)
            .where(eq(sports.id, sportId))
            .returning();
        if (!updatedSport) {
            throw new SportError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
        }
        return updatedSport;
    }
    /**
     * Suppression d'un sport
     */
    static async deleteSport(sportId) {
        const deletedRows = await db
            .delete(sports)
            .where(eq(sports.id, sportId))
            .returning({ id: sports.id });
        if (deletedRows.length === 0) {
            throw new SportError("Sport non trouvé", "SPORT_NOT_FOUND", 404);
        }
    }
}
//# sourceMappingURL=sport.services.js.map