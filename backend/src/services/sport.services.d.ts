import "dotenv/config";
import { sports } from "../db/schema.js";
/**
 * SERVICE SPORT
 *
 * Contient la logique métier liée à la liste de référence des sports.
 */
export type Sport = typeof sports.$inferSelect;
export interface SportCreateInput {
    name: string;
}
export interface SportUpdateInput {
    name?: string;
}
export declare class SportError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class SportService {
    /**
     * Liste de tous les sports
     */
    static listSports(): Promise<Sport[]>;
    /**
     * Récupération d'un sport par son ID
     */
    static getSportById(sportId: string): Promise<Sport | null>;
    /**
     * Création d'un nouveau sport
     */
    static createSport(data: SportCreateInput): Promise<Sport>;
    /**
     * Mise à jour d'un sport
     */
    static updateSport(sportId: string, data: SportUpdateInput): Promise<Sport>;
    /**
     * Suppression d'un sport
     */
    static deleteSport(sportId: string): Promise<void>;
}
//# sourceMappingURL=sport.services.d.ts.map