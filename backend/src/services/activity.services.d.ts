import "dotenv/config";
import { activities, activitiesStatusEnum, sportLevelEnum } from "../db/schema.js";
/**
 * SERVICE ACTIVITÉ
 *
 * Contient la logique métier liée à la création, la consultation et
 * la gestion des activités sportives.
 */
export type ActivityLevel = (typeof sportLevelEnum.enumValues)[number];
export type ActivityStatus = (typeof activitiesStatusEnum.enumValues)[number];
export type Activity = typeof activities.$inferSelect;
export interface ActivityCreateInput {
    title: string;
    description?: string | null;
    city: string;
    startDate: Date;
    latitude?: number | null;
    longitude?: number | null;
    levelRequired: ActivityLevel;
    maxParticipants: number;
    sportId: string;
}
export interface ActivityUpdateInput {
    title?: string;
    description?: string | null;
    city?: string;
    startDate?: Date;
    latitude?: number | null;
    longitude?: number | null;
    levelRequired?: ActivityLevel;
    maxParticipants?: number;
    status?: ActivityStatus;
    sportId?: string;
}
export interface ActivityFilters {
    city?: string;
    sportId?: string;
    status?: ActivityStatus;
}
export declare class ActivityError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class ActivityService {
    /**
     * Création d'une nouvelle activité
     */
    static createActivity(creatorId: string, data: ActivityCreateInput): Promise<Activity>;
    /**
     * Récupération d'une activité par son ID
     */
    static getActivityById(activityId: string): Promise<Activity | null>;
    /**
     * Liste des activités, avec filtres optionnels
     */
    static listActivities(filters?: ActivityFilters): Promise<Activity[]>;
    /**
     * Mise à jour d'une activité (réservé à son créateur)
     */
    static updateActivity(activityId: string, requesterId: string, data: ActivityUpdateInput): Promise<Activity>;
    /**
     * Suppression d'une activité (réservé à son créateur)
     */
    static deleteActivity(activityId: string, requesterId: string): Promise<void>;
}
//# sourceMappingURL=activity.services.d.ts.map