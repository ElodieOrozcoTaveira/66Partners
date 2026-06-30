import "dotenv/config";
import { sportLevelEnum } from "../db/schema.js";
export type SportLevel = (typeof sportLevelEnum.enumValues)[number];
export interface UserSportEntry {
    sportId: string;
    sportName: string;
    level: SportLevel;
}
/**
 * SERVICE UTILISATEUR
 *
 * Contient la logique métier liée à la gestion du profil utilisateur
 * (lecture, mise à jour, suppression). L'inscription/connexion reste
 * gérée par AuthService.
 */
export interface UserProfile {
    id: string;
    email: string;
    pseudo: string;
    city: string | null;
    bio: string | null;
    avatar: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserUpdateInput {
    pseudo?: string;
    city?: string | null;
    bio?: string | null;
    avatar?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}
export declare class UserError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class UserService {
    /**
     * Récupération du profil d'un utilisateur par son ID
     */
    static getUserById(userId: string): Promise<UserProfile | null>;
    /**
     * Mise à jour du profil d'un utilisateur
     */
    static updateUser(userId: string, data: UserUpdateInput): Promise<UserProfile>;
    /**
     * Suppression d'un utilisateur
     */
    static deleteUser(userId: string): Promise<void>;
    /**
     * Liste des sports pratiqués par un utilisateur, avec leur niveau
     */
    static listUserSports(userId: string): Promise<UserSportEntry[]>;
    /**
     * Ajout ou mise à jour du niveau d'un sport pratiqué par l'utilisateur
     */
    static setUserSport(userId: string, sportId: string, level: SportLevel): Promise<UserSportEntry>;
    /**
     * Retrait d'un sport pratiqué par l'utilisateur
     */
    static removeUserSport(userId: string, sportId: string): Promise<void>;
}
//# sourceMappingURL=user.services.d.ts.map