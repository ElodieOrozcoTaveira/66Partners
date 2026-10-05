import request from "supertest";
import app from "../../src/app.js";
import { resetUsers, closeTestDb, testDb, createUser } from "../helpers/db.js";
import { pushSubscriptions } from "../../src/db/schema.js";
import { eq } from "drizzle-orm";

const validKeys = { p256dh: "test-p256dh-key", auth: "test-auth-key" };

beforeEach(async () => {
  await resetUsers();
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/push/subscribe", () => {
  it("crée un abonnement pour l'utilisateur authentifié", async () => {
    const { token, userId } = await createUser({ email: "push1@example.com" });
    const endpoint = "https://push.example.com/unique-endpoint-1";

    const res = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${token}`)
      .send({ endpoint, keys: validKeys });

    expect(res.status).toBe(201);

    const rows = await testDb.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(userId);
  });

  it("un second abonnement du même utilisateur avec le même endpoint est un no-op (pas de doublon)", async () => {
    const { token, userId } = await createUser({ email: "push2@example.com" });
    const endpoint = "https://push.example.com/unique-endpoint-2";

    await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${token}`)
      .send({ endpoint, keys: validKeys });

    const res = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${token}`)
      .send({ endpoint, keys: validKeys });

    expect(res.status).toBe(201);

    const rows = await testDb.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(userId);
  });

  /**
   * Reproduit exactement le bug constaté en staging : deux comptes sur le
   * même appareil/navigateur — le navigateur renvoie le MÊME endpoint pour
   * le second compte (comportement normal de PushManager.getSubscription(),
   * l'abonnement est lié au service worker, pas au compte 66Partners). Le
   * second compte doit récupérer la propriété de l'abonnement, jamais rester
   * sans aucune ligne en base (sinon il ne reçoit jamais de notification).
   */
  it("un second utilisateur qui reprend le même endpoint (même appareil) devient le nouveau propriétaire", async () => {
    const { token: tokenA, userId: userIdA } = await createUser({ email: "pushA@example.com" });
    const { token: tokenB, userId: userIdB } = await createUser({ email: "pushB@example.com" });
    const sharedEndpoint = "https://push.example.com/shared-device-endpoint";

    await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ endpoint: sharedEndpoint, keys: validKeys });

    const resB = await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ endpoint: sharedEndpoint, keys: validKeys });

    expect(resB.status).toBe(201);

    const rows = await testDb
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, sharedEndpoint));

    // Une seule ligne pour cet endpoint (contrainte unique globale), et elle
    // appartient maintenant à B, plus à A.
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(userIdB);
    expect(rows[0]!.userId).not.toBe(userIdA);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .post("/api/push/subscribe")
      .send({ endpoint: "https://push.example.com/x", keys: validKeys });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/push/unsubscribe", () => {
  it("supprime uniquement l'abonnement de l'utilisateur authentifié pour cet endpoint", async () => {
    const { token, userId } = await createUser({ email: "push3@example.com" });
    const endpoint = "https://push.example.com/unique-endpoint-3";

    await request(app)
      .post("/api/push/subscribe")
      .set("Authorization", `Bearer ${token}`)
      .send({ endpoint, keys: validKeys });

    const res = await request(app)
      .post("/api/push/unsubscribe")
      .set("Authorization", `Bearer ${token}`)
      .send({ endpoint });

    expect(res.status).toBe(200);

    const rows = await testDb.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(0);
    void userId;
  });
});
