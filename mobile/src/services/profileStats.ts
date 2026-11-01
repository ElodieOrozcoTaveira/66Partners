import { getActivities } from "./activities.service";
import type { Activity } from "../types/domain";

export type MyActivitiesKind = "participations" | "created";

/**
 * Activités de l'utilisateur sur son territoire, à partir des routes
 * existantes (aucune route dédiée côté API) :
 * - participations : GET /activities?participantId= (participations acceptées) ;
 * - créées : GET /activities filtrées sur creatorId.
 * Triées de la plus proche à la plus lointaine dans le futur, puis le passé.
 */
export async function getMyActivities(
  kind: MyActivitiesKind,
  territory: string,
  userId: string
): Promise<Activity[]> {
  const list =
    kind === "participations"
      ? await getActivities({ territory, participantId: userId })
      : (await getActivities({ territory })).filter((activity) => activity.creatorId === userId);

  const now = Date.now();
  const time = (activity: Activity) => new Date(activity.startDate).getTime();
  const upcoming = list.filter((a) => time(a) >= now).sort((a, b) => time(a) - time(b));
  const past = list.filter((a) => time(a) < now).sort((a, b) => time(b) - time(a));
  return [...upcoming, ...past];
}

export interface MemberStats {
  /** Sorties rejointes (participations acceptées, hors activités annulées). */
  joined: number;
  /** Activités organisées. */
  organized: number;
  /** Partenaires cumulés : participants acceptés sur ses activités. */
  partners: number;
}

/**
 * Statistiques d'un autre membre, sur le territoire du visiteur — même calcul
 * que le site (frontend/src/components/ProfilPage/StatsProfil).
 */
export async function getMemberStats(territory: string, userId: string): Promise<MemberStats> {
  const [all, joined] = await Promise.all([
    getActivities({ territory }),
    getActivities({ territory, participantId: userId }),
  ]);
  const organized = all.filter((activity) => activity.creatorId === userId);

  return {
    joined: joined.filter((activity) => activity.status !== "CANCELLED").length,
    organized: organized.length,
    partners: organized.reduce((sum, activity) => sum + (Number(activity.participantsCount) || 0), 0),
  };
}
