import "dotenv/config";
import { and, desc, eq, gt, inArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { activities, participations, userBlocks, users } from "../db/schema.js";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * SERVICE BLOCAGES
 *
 * Un blocage rend deux membres invisibles l'un pour l'autre, dans les deux
 * sens : profils, activités, messages et photos. Celui qui est bloqué n'en
 * est jamais informé (les contenus lui répondent simplement "introuvable").
 */

export class BlockError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "BlockError";
  }
}

export interface BlockedUser {
  userId: string;
  pseudo: string;
  avatar: string | null;
  blockedAt: Date;
}

/**
 * Condition SQL : `column` (un identifiant de membre) n'est pas bloqué avec
 * `viewerId`, dans un sens comme dans l'autre. Un identifiant NULL (compte
 * supprimé) passe toujours.
 */
export function notBlockedWith(viewerId: string, column: AnyPgColumn): SQL {
  return sql`not exists (
    select 1 from ${userBlocks}
    where (${userBlocks.blockerId} = ${viewerId}::uuid and ${userBlocks.blockedId} = ${column})
       or (${userBlocks.blockedId} = ${viewerId}::uuid and ${userBlocks.blockerId} = ${column})
  )`;
}

export class BlockService {
  /** Membres masqués pour `userId` : ceux qu'il a bloqués et ceux qui l'ont bloqué. */
  static async hiddenUserIds(userId: string): Promise<Set<string>> {
    const rows = await db
      .select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(or(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, userId)));

    return new Set(rows.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId)));
  }

  /** Vrai si l'un des deux a bloqué l'autre. */
  static async isBlockedBetween(userA: string, userB: string | null): Promise<boolean> {
    if (!userB || userA === userB) return false;
    const [row] = await db
      .select({ blockerId: userBlocks.blockerId })
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blockerId, userA), eq(userBlocks.blockedId, userB)),
          and(eq(userBlocks.blockerId, userB), eq(userBlocks.blockedId, userA))
        )
      )
      .limit(1);
    return Boolean(row);
  }

  static async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new BlockError("Tu ne peux pas te bloquer toi-même", "CANNOT_BLOCK_SELF", 400);
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, blockedId)).limit(1);
    if (!target) {
      throw new BlockError("Utilisateur non trouvé", "USER_NOT_FOUND", 404);
    }

    await db.insert(userBlocks).values({ blockerId, blockedId }).onConflictDoNothing();

    // Plus d'activité commune à venir : les demandes et participations de
    // l'un aux activités futures de l'autre sont retirées (comme une
    // désinscription). Les activités passées ne sont pas modifiées.
    const futureActivitiesOf = (creatorId: string) =>
      db
        .select({ id: activities.id })
        .from(activities)
        .where(and(eq(activities.creatorId, creatorId), gt(activities.startDate, new Date())));

    await db
      .delete(participations)
      .where(
        or(
          and(eq(participations.userId, blockedId), inArray(participations.activityId, futureActivitiesOf(blockerId))),
          and(eq(participations.userId, blockerId), inArray(participations.activityId, futureActivitiesOf(blockedId)))
        )
      );
  }

  static async unblock(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
  }

  /** Membres que `userId` a bloqués (pas ceux qui l'ont bloqué). */
  static async listBlockedBy(userId: string): Promise<BlockedUser[]> {
    return db
      .select({
        userId: users.id,
        pseudo: users.pseudo,
        avatar: users.avatar,
        blockedAt: userBlocks.createdAt,
      })
      .from(userBlocks)
      .innerJoin(users, eq(users.id, userBlocks.blockedId))
      .where(eq(userBlocks.blockerId, userId))
      .orderBy(desc(userBlocks.createdAt));
  }
}
