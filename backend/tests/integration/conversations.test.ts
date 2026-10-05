import request from "supertest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import app from "../../src/app.js";
import { activities } from "../../src/db/schema.js";
import {
  resetAll,
  createUser,
  createSport,
  createTerritory,
  attachUserToTerritory,
  closeTestDb,
  testDb,
} from "../helpers/db.js";

const futureDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

let sportId: string;
let territory34: { id: string; code: string };

function validActivity(overrides: Record<string, unknown> = {}) {
  return {
    title: "Sortie running",
    city: "Perpignan",
    startDate: futureDate(),
    levelRequired: "BEGINNER",
    maxParticipants: 5,
    sportId,
    ...overrides,
  };
}

async function createActivity(token: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send(validActivity(overrides));
  return res.body.activity.id as string;
}

beforeEach(async () => {
  await resetAll();
  sportId = await createSport("Running");
  territory34 = await createTerritory({ code: "34" });
});

afterAll(async () => {
  await closeTestDb();
});

describe("Isolation territoriale de la messagerie", () => {
  it("A. refuse de consulter/envoyer/lister une conversation d'une activité 34 depuis le contexte 66 (404 WRONG_TERRITORY)", async () => {
    const { userId: creatorId, token: creatorToken } = await createUser({
      email: "creator34@test.com",
    });
    await attachUserToTerritory(creatorId, territory34.id);
    const activityId = await createActivity(creatorToken, { territoryId: territory34.id });

    // Crée bien le fil de groupe dans son territoire réel (34).
    const createRes = await request(app)
      .get(`/api/activities/${activityId}/conversation?territory=34`)
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(createRes.status).toBe(200);
    const conversationId = createRes.body.conversation.id as string;

    const wrongGetOrCreate = await request(app)
      .get(`/api/activities/${activityId}/conversation?territory=66`)
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(wrongGetOrCreate.status).toBe(404);
    expect(wrongGetOrCreate.body.code).toBe("WRONG_TERRITORY");

    const wrongMessages = await request(app)
      .get(`/api/conversations/${conversationId}/messages?territory=66`)
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(wrongMessages.status).toBe(404);
    expect(wrongMessages.body.code).toBe("WRONG_TERRITORY");

    const wrongSend = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ contenu: "Coucou", territory: "66" });
    expect(wrongSend.status).toBe(404);
    expect(wrongSend.body.code).toBe("WRONG_TERRITORY");
  });

  it("B/C. GET /api/conversations/mine ne retourne que les conversations du territoire demandé", async () => {
    // Même compte, membre des deux territoires (66 par défaut à l'inscription + 34 rattaché).
    // territoryCode fixé explicitement : sur une base fraîchement migrée (jamais
    // passée par seed-territories.ts avant la migration de données), "34" peut
    // avoir un createdAt antérieur à "66", ce qui romprait silencieusement le
    // repli "premier territoire actif" — hors sujet de ce test d'isolation.
    const { userId, token } = await createUser({ email: "multi@test.com", territoryCode: "66" });
    await attachUserToTerritory(userId, territory34.id);

    const activity66Id = await createActivity(token);
    const activity34Id = await createActivity(token, { territoryId: territory34.id });

    await request(app)
      .get(`/api/activities/${activity66Id}/conversation?territory=66`)
      .set("Authorization", `Bearer ${token}`);
    await request(app)
      .get(`/api/activities/${activity34Id}/conversation?territory=34`)
      .set("Authorization", `Bearer ${token}`);

    const mine66 = await request(app)
      .get("/api/conversations/mine?territory=66")
      .set("Authorization", `Bearer ${token}`);
    expect(mine66.status).toBe(200);
    expect(mine66.body.conversations).toHaveLength(1);
    expect(mine66.body.conversations[0].activityId).toBe(activity66Id);

    const mine34 = await request(app)
      .get("/api/conversations/mine?territory=34")
      .set("Authorization", `Bearer ${token}`);
    expect(mine34.status).toBe(200);
    expect(mine34.body.conversations).toHaveLength(1);
    expect(mine34.body.conversations[0].activityId).toBe(activity34Id);
  });

  it("D. territory manquant sur /api/conversations/mine → 400", async () => {
    const { token } = await createUser({ email: "notterritory@test.com" });
    const res = await request(app)
      .get("/api/conversations/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("E. territory inconnu → 404", async () => {
    const { token } = await createUser({ email: "unknownterritory@test.com" });
    const res = await request(app)
      .get("/api/conversations/mine?territory=ZZ")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("F. utilisateur autorisé sur la bonne activité + bon territoire → fonctionnement normal", async () => {
    const { token } = await createUser({ email: "normal@test.com", territoryCode: "66" });
    const activityId = await createActivity(token);

    const createRes = await request(app)
      .get(`/api/activities/${activityId}/conversation?territory=66`)
      .set("Authorization", `Bearer ${token}`);
    expect(createRes.status).toBe(200);
    const conversationId = createRes.body.conversation.id as string;

    const sendRes = await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contenu: "Salut !", territory: "66" });
    expect(sendRes.status).toBe(201);

    const messagesRes = await request(app)
      .get(`/api/conversations/${conversationId}/messages?territory=66`)
      .set("Authorization", `Bearer ${token}`);
    expect(messagesRes.status).toBe(200);
    expect(messagesRes.body.messages).toHaveLength(1);
  });

  it("G. conversation covoiturage : bon territoire → normal, mauvais territoire → 404 WRONG_TERRITORY", async () => {
    const { token: creatorToken } = await createUser({
      email: "carpoolcreator@test.com",
      territoryCode: "66",
    });
    const { userId: joinerId, token: joinerToken } = await createUser({
      email: "carpooljoiner@test.com",
      territoryCode: "66",
    });
    const activityId = await createActivity(creatorToken, { carpoolEnabled: true });

    const joinRes = await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${joinerToken}`);
    const participationId = joinRes.body.participation.id as string;

    await request(app)
      .put(`/api/participations/${participationId}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    // Crée le fil covoiturage (scopé en interne au territoire réel de
    // l'activité — jamais une valeur fournie par le client, cf.
    // ParticipationService.requestCarpool).
    const requestRes = await request(app)
      .post(`/api/activities/${activityId}/carpool`)
      .set("Authorization", `Bearer ${joinerToken}`);
    expect(requestRes.status).toBe(200);

    const rightTerritory = await request(app)
      .get(`/api/activities/${activityId}/conversation?carpool=${joinerId}&territory=66`)
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(rightTerritory.status).toBe(200);

    const wrongTerritory = await request(app)
      .get(`/api/activities/${activityId}/conversation?carpool=${joinerId}&territory=34`)
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(wrongTerritory.status).toBe(404);
    expect(wrongTerritory.body.code).toBe("WRONG_TERRITORY");
  });

  it("10. ConversationService.listMine continue d'exposer les conversations d'activités passées (chantier filtres de date)", async () => {
    const { token } = await createUser({ email: "pastconv@test.com", territoryCode: "66" });
    const activityId = await createActivity(token);
    await testDb
      .update(activities)
      .set({ startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .where(eq(activities.id, activityId));

    await request(app)
      .get(`/api/activities/${activityId}/conversation?territory=66`)
      .set("Authorization", `Bearer ${token}`);

    const mineRes = await request(app)
      .get("/api/conversations/mine?territory=66")
      .set("Authorization", `Bearer ${token}`);

    expect(mineRes.status).toBe(200);
    expect(mineRes.body.conversations.map((c: { activityId: string }) => c.activityId)).toContain(
      activityId
    );
  });
});
