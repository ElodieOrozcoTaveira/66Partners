import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { socialAccounts } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

export type SocialProvider = "google" | "facebook";

export interface SocialAccountLink {
  userId: string;
  provider: SocialProvider;
  providerUserId: string;
  email: string;
}

/**
 * SERVICE COMPTES SOCIAUX
 *
 * Table dédiée (social_accounts) plutôt qu'une surcharge de `users` :
 * un compte 66Partners reste un compte global, éventuellement lié à
 * plusieurs fournisseurs ("google" et "facebook" aujourd'hui).
 */
export class SocialAccountService {
  static async findUserIdByProvider(
    provider: SocialProvider,
    providerUserId: string
  ): Promise<string | null> {
    const [row] = await db
      .select({ userId: socialAccounts.userId })
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.provider, provider),
          eq(socialAccounts.providerUserId, providerUserId)
        )
      )
      .limit(1);

    return row?.userId ?? null;
  }

  /**
   * Associe un compte social à un utilisateur. Idempotent sur
   * (provider, providerUserId) : une nouvelle tentative de liaison du même
   * compte Google au même utilisateur ne duplique rien.
   */
  static async link(data: SocialAccountLink): Promise<void> {
    await db
      .insert(socialAccounts)
      .values({
        userId: data.userId,
        provider: data.provider,
        providerUserId: data.providerUserId,
        email: data.email,
      })
      .onConflictDoNothing({
        target: [socialAccounts.provider, socialAccounts.providerUserId],
      });
  }
}
