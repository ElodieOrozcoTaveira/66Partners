import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { activityAudienceEnum, genderEnum, users } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

export type ActivityAudience = (typeof activityAudienceEnum.enumValues)[number];
export type Gender = (typeof genderEnum.enumValues)[number];

/** Genre requis pour une activité réservée, null si ouverte à tous. */
export function requiredGender(audience: ActivityAudience): Gender | null {
  if (audience === "WOMEN") return "FEMALE";
  if (audience === "MEN") return "MALE";
  return null;
}

export type AudienceCheck =
  | { ok: true }
  /** Genre non renseigné : le client propose de le renseigner. */
  | { ok: false; code: "GENDER_REQUIRED"; message: string }
  /** Genre renseigné mais différent du public de l'activité. */
  | { ok: false; code: "AUDIENCE_RESTRICTED"; message: string };

const AUDIENCE_LABEL: Record<Exclude<ActivityAudience, "ALL">, string> = {
  WOMEN: "entre femmes",
  MEN: "entre hommes",
};

/**
 * Vérifie qu'un utilisateur peut participer à (ou organiser) une activité
 * de ce public. Lit le genre en base, jamais une valeur envoyée par le client.
 */
export async function checkAudience(userId: string, audience: ActivityAudience): Promise<AudienceCheck> {
  const required = requiredGender(audience);
  if (!required) return { ok: true };

  const [user] = await db
    .select({ gender: users.gender })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const label = AUDIENCE_LABEL[audience as Exclude<ActivityAudience, "ALL">];
  if (!user?.gender) {
    return {
      ok: false,
      code: "GENDER_REQUIRED",
      message: `Cette activité est ${label} : indique ton genre dans ton profil pour continuer.`,
    };
  }
  if (user.gender !== required) {
    return { ok: false, code: "AUDIENCE_RESTRICTED", message: `Cette activité est réservée (${label}).` };
  }
  return { ok: true };
}
