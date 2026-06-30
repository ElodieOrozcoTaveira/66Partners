import "dotenv/config";
import { participations } from "../db/schema.js";
/**
 * SERVICE PARTICIPATION
 *
 * Contient la logique métier liée aux demandes de participation
 * à une activité (rejoindre, accepter, refuser, annuler).
 */
export type Participation = typeof participations.$inferSelect;
export declare class ParticipationError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class ParticipationService {
    /**
     * Demande pour rejoindre une activité
     */
    static joinActivity(userId: string, activityId: string): Promise<Participation>;
    /**
     * Acceptation d'une demande de participation (réservé au créateur de l'activité)
     */
    static acceptParticipation(participationId: string, requesterId: string): Promise<Participation>;
    /**
     * Refus d'une demande de participation (réservé au créateur de l'activité)
     */
    static refuseParticipation(participationId: string, requesterId: string): Promise<Participation>;
    /**
     * Annulation d'une demande de participation (réservé à son auteur)
     */
    static cancelParticipation(participationId: string, requesterId: string): Promise<void>;
}
//# sourceMappingURL=participation.services.d.ts.map