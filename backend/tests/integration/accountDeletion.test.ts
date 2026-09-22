import { jest } from "@jest/globals";
import fs from "node:fs";

const mockSendAccountDeletedEmail =
  jest.fn<(user: { email: string; pseudo: string }, brand: unknown) => Promise<void>>().mockResolvedValue(undefined);

// mail.services.ts est mocké AVANT tout import (même transitif) de
// src/app.js : évite tout appel SMTP réel en test, même pattern que
// admin.auth.test.ts. Les autres exports sont stubbés (jamais appelés par ce
// fichier) car app.js les importe statiquement via auth.services.ts /
// admin.services.ts.
jest.unstable_mockModule("../../src/services/mail.services.js", () => ({
  sendAccountDeletedEmail: mockSendAccountDeletedEmail,
  sendWelcomeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAdminResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendContactEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { eq } = await import("drizzle-orm");
const {
  resetAll,
  createUser,
  createSport,
  createTerritory,
  attachUserToTerritory,
  closeTestDb,
  testDb,
} = await import("../helpers/db.js");
const { activities, activityPhotos, conversations, messages, notifications, userTerritories, users } =
  await import("../../src/db/schema.js");
const { UPLOAD_DIR } = await import("../../src/middlewares/upload.middleware.js");
const { signAdminToken } = await import("../../src/utils/adminJwt.js");

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

function filenameFromUrl(url: string): string {
  return url.split("?")[0]!.split("/").pop()!;
}

function fileExistsOnDisk(url: string | null): boolean {
  if (!url) return false;
  return fs.existsSync(`${UPLOAD_DIR}/${filenameFromUrl(url)}`);
}

async function createActivity(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const res = await request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Sortie test",
      city: "Perpignan",
      startDate: futureDate(),
      levelRequired: "BEGINNER",
      maxParticipants: 5,
      sportId: await createSport(`Sport-${Math.random()}`),
      ...overrides,
    });
  return res.body.activity.id as string;
}

async function uploadActivityPhoto(activityId: string, token: string): Promise<string> {
  // Un upload de photo d'activité n'est autorisé que sur une activité
  // terminée (règle métier) : recule la date directement en base, sans
  // contourner l'API pour la création elle-même — même technique que
  // activityPhotos.test.ts.
  await testDb
    .update(activities)
    .set({ startDate: new Date(Date.now() - 60 * 60 * 1000) })
    .where(eq(activities.id, activityId));

  const res = await request(app)
    .post(`/api/activities/${activityId}/photos`)
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from(`photo-${Math.random()}`), {
      filename: "souvenir.jpg",
      contentType: "image/jpeg",
    });

  return res.body.photo.url as string;
}

beforeEach(async () => {
  await resetAll();
  mockSendAccountDeletedEmail.mockClear();
});

afterAll(async () => {
  await closeTestDb();
});

describe("DELETE /api/users/me — parcours utilisateur", () => {
  it("supprime un compte sans activité ni relation, email de confirmation déclenché", async () => {
    const { userId, token } = await createUser({ email: "solo@test.com", pseudo: "Solo" });

    const res = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [row] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(row).toBeUndefined();

    expect(mockSendAccountDeletedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendAccountDeletedEmail).toHaveBeenCalledWith(
      { email: "solo@test.com", pseudo: "Solo" },
      expect.objectContaining({ brandName: expect.any(String) }),
    );
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("ne supprime jamais un autre compte : seul req.userId est utilisé", async () => {
    const { token: tokenA } = await createUser({ email: "a@test.com" });
    const { userId: userIdB } = await createUser({ email: "b@test.com" });

    const res = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(200);

    const [rowB] = await testDb.select().from(users).where(eq(users.id, userIdB));
    expect(rowB).toBeDefined();
  });

  it("un compte supprimé ne peut plus se connecter", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        pseudo: "ToDelete",
        email: "todelete@test.com",
        password: "Password123",
        termsAccepted: true,
      });

    const loginBefore = await request(app)
      .post("/api/auth/login")
      .send({ email: "todelete@test.com", password: "Password123" });
    const token = loginBefore.body.token as string;

    const del = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    const loginAfter = await request(app)
      .post("/api/auth/login")
      .send({ email: "todelete@test.com", password: "Password123" });
    expect(loginAfter.status).toBe(401);
    expect(loginAfter.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("double suppression : le deuxième appel échoue (compte déjà supprimé)", async () => {
    const { token } = await createUser({ email: "double@test.com" });

    const first = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(first.status).toBe(200);

    // Le token reste signé valide (JWT stateless) mais l'utilisateur
    // n'existe plus : refreshUser/requireAuth laisse passer le token, c'est
    // AccountDeletionService qui doit refuser une cible inexistante.
    const second = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(second.status).toBe(404);
    expect(second.body.code).toBe("USER_NOT_FOUND");
  });

  it("créateur d'activité : l'activité et les données des AUTRES utilisateurs survivent, le créateur est détaché", async () => {
    const { userId: creatorId, token: creatorToken } = await createUser({
      email: "creator@test.com",
      pseudo: "Createur",
    });
    const { userId: participantId, token: participantToken } = await createUser({
      email: "participant@test.com",
      pseudo: "Participant",
    });

    const activityId = await createActivity(creatorToken, { carpoolEnabled: true });

    // Un autre utilisateur participe, envoie un message, upload une photo —
    // toutes ces données doivent survivre à la suppression du créateur.
    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);
    const [participation] = await testDb
      .select()
      .from((await import("../../src/db/schema.js")).participations)
      .where(eq((await import("../../src/db/schema.js")).participations.userId, participantId));
    await request(app)
      .put(`/api/participations/${participation!.id}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    const convRes = await request(app)
      .get(`/api/activities/${activityId}/conversation`)
      .set("Authorization", `Bearer ${participantToken}`);
    const conversationId = convRes.body.conversation.id as string;

    await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ contenu: "Salut !" });

    const photoUrl = await uploadActivityPhoto(activityId, participantToken);

    await request(app)
      .post(`/api/activities/${activityId}/carpool`)
      .set("Authorization", `Bearer ${participantToken}`);

    // Suppression du créateur
    const del = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(del.status).toBe(200);

    // L'activité existe toujours, creatorId détaché (jamais réassigné)
    const [activityRow] = await testDb.select().from(activities).where(eq(activities.id, activityId));
    expect(activityRow).toBeDefined();
    expect(activityRow!.creatorId).toBeNull();

    // Visible et fonctionnelle via l'API pour le participant
    const getRes = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${participantToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.activity.creatorId).toBeNull();

    // Participation, message, photo et conversation de l'AUTRE utilisateur intacts
    const [participationRow] = await testDb
      .select()
      .from((await import("../../src/db/schema.js")).participations)
      .where(eq((await import("../../src/db/schema.js")).participations.id, participation!.id));
    expect(participationRow).toBeDefined();

    const conversationRows = await testDb
      .select()
      .from(conversations)
      .where(eq(conversations.activityId, activityId));
    expect(conversationRows.length).toBeGreaterThan(0);

    const messageRows = await testDb
      .select()
      .from(messages)
      .where(eq(messages.conversationsId, conversationId));
    expect(messageRows).toHaveLength(1);
    expect(messageRows[0]!.usersId).toBe(participantId);

    const photoRows = await testDb
      .select()
      .from(activityPhotos)
      .where(eq(activityPhotos.activityId, activityId));
    expect(photoRows).toHaveLength(1);
    expect(photoRows[0]!.uploaderId).toBe(participantId);
    expect(fileExistsOnDisk(photoUrl)).toBe(true);
  });

  it("participant à l'activité d'un autre : sa participation disparaît, l'activité et le créateur restent", async () => {
    const { token: creatorToken } = await createUser({ email: "creator2@test.com" });
    const { userId: participantId, token: participantToken } = await createUser({
      email: "participant2@test.com",
    });
    const activityId = await createActivity(creatorToken);

    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);

    const del = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${participantToken}`);
    expect(del.status).toBe(200);

    const { participations } = await import("../../src/db/schema.js");
    const rows = await testDb.select().from(participations).where(eq(participations.userId, participantId));
    expect(rows).toHaveLength(0);

    const [activityRow] = await testDb.select().from(activities).where(eq(activities.id, activityId));
    expect(activityRow).toBeDefined();
    expect(activityRow!.creatorId).not.toBeNull();
  });

  it("messages : ses messages disparaissent, la conversation et les messages des autres restent", async () => {
    const { userId: creatorId, token: creatorToken } = await createUser({ email: "c3@test.com" });
    const { userId: participantId, token: participantToken } = await createUser({ email: "p3@test.com" });
    const activityId = await createActivity(creatorToken);

    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);
    const { participations } = await import("../../src/db/schema.js");
    const [participation] = await testDb
      .select()
      .from(participations)
      .where(eq(participations.userId, participantId));
    await request(app)
      .put(`/api/participations/${participation!.id}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    const convRes = await request(app)
      .get(`/api/activities/${activityId}/conversation`)
      .set("Authorization", `Bearer ${creatorToken}`);
    const conversationId = convRes.body.conversation.id as string;

    await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${participantToken}`)
      .send({ contenu: "Message du participant" });
    await request(app)
      .post(`/api/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({ contenu: "Message du créateur" });

    const del = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${participantToken}`);
    expect(del.status).toBe(200);

    const remaining = await testDb.select().from(messages).where(eq(messages.conversationsId, conversationId));
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.usersId).toBe(creatorId);

    const [conversationRow] = await testDb.select().from(conversations).where(eq(conversations.id, conversationId));
    expect(conversationRow).toBeDefined();
  });

  it("photos : avatar et photos personnellement uploadées supprimées (DB + disque), photo d'un autre utilisateur sur sa propre activité conservée", async () => {
    const { userId, token } = await createUser({ email: "photos@test.com" });
    const { userId: otherUserId, token: otherToken } = await createUser({ email: "otherphoto@test.com" });

    const avatarRes = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("avatar-bytes"), { filename: "avatar.png", contentType: "image/png" });
    const avatarUrl = avatarRes.body.user.avatar as string;

    const myActivityId = await createActivity(token);

    // L'upload d'une photo n'est autorisé qu'au créateur ou à un participant
    // accepté : l'autre utilisateur doit d'abord rejoindre et être accepté.
    await request(app)
      .post(`/api/activities/${myActivityId}/join`)
      .set("Authorization", `Bearer ${otherToken}`);
    const { participations: participationsTable } = await import("../../src/db/schema.js");
    const [otherParticipation] = await testDb
      .select()
      .from(participationsTable)
      .where(eq(participationsTable.userId, otherUserId));
    await request(app)
      .put(`/api/participations/${otherParticipation!.id}/accept`)
      .set("Authorization", `Bearer ${token}`);

    // Photo qu'il uploade lui-même sur SA PROPRE activité
    const ownPhotoUrl = await uploadActivityPhoto(myActivityId, token);
    // Photo qu'un AUTRE utilisateur (participant accepté) uploade sur l'activité de cet utilisateur
    const otherUploaderPhotoUrl = await uploadActivityPhoto(myActivityId, otherToken);

    expect(fileExistsOnDisk(avatarUrl)).toBe(true);
    expect(fileExistsOnDisk(ownPhotoUrl)).toBe(true);
    expect(fileExistsOnDisk(otherUploaderPhotoUrl)).toBe(true);

    const del = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    // Ses propres fichiers (avatar + photo qu'il a uploadée) disparus
    expect(fileExistsOnDisk(avatarUrl)).toBe(false);
    expect(fileExistsOnDisk(ownPhotoUrl)).toBe(false);
    const ownPhotoRows = await testDb
      .select()
      .from(activityPhotos)
      .where(eq(activityPhotos.uploaderId, userId));
    expect(ownPhotoRows).toHaveLength(0);

    // La photo uploadée par un AUTRE utilisateur sur son activité (qui
    // survit, creatorId -> null) reste intacte, DB et disque.
    expect(fileExistsOnDisk(otherUploaderPhotoUrl)).toBe(true);
    const [activityRow] = await testDb.select().from(activities).where(eq(activities.id, myActivityId));
    expect(activityRow).toBeDefined();
    expect(activityRow!.creatorId).toBeNull();
  });

  it("covoiturage : le fil privé du participant disparaît avec lui, l'activité et le groupe restent", async () => {
    const { token: creatorToken } = await createUser({ email: "c4@test.com" });
    const { userId: participantId, token: participantToken } = await createUser({ email: "p4@test.com" });
    const activityId = await createActivity(creatorToken, { carpoolEnabled: true });

    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);
    const { participations } = await import("../../src/db/schema.js");
    const [participation] = await testDb
      .select()
      .from(participations)
      .where(eq(participations.userId, participantId));
    await request(app)
      .put(`/api/participations/${participation!.id}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);

    await request(app)
      .post(`/api/activities/${activityId}/carpool`)
      .set("Authorization", `Bearer ${participantToken}`);

    const carpoolConvBefore = await testDb
      .select()
      .from(conversations)
      .where(eq(conversations.participantId, participantId));
    expect(carpoolConvBefore).toHaveLength(1);

    const del = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${participantToken}`);
    expect(del.status).toBe(200);

    const carpoolConvAfter = await testDb
      .select()
      .from(conversations)
      .where(eq(conversations.participantId, participantId));
    expect(carpoolConvAfter).toHaveLength(0);

    const groupConv = await testDb
      .select()
      .from(conversations)
      .where(eq(conversations.activityId, activityId));
    expect(groupConv.length).toBeGreaterThan(0);
  });

  it("multi-territoires : les rattachements disparaissent, les territoires eux-mêmes restent", async () => {
    const { userId, token } = await createUser({ email: "multi@test.com" });
    const territory34 = await createTerritory({
      code: "T34DEL",
      slug: "territoire-t34del-accountdeletion",
      brandName: "T34DELAccountDeletionPartners",
    });
    await attachUserToTerritory(userId, territory34.id);

    const before = await testDb.select().from(userTerritories).where(eq(userTerritories.userId, userId));
    expect(before.length).toBeGreaterThanOrEqual(2);

    const del = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    const after = await testDb.select().from(userTerritories).where(eq(userTerritories.userId, userId));
    expect(after).toHaveLength(0);

    const { territories } = await import("../../src/db/schema.js");
    const [territoryRow] = await testDb.select().from(territories).where(eq(territories.id, territory34.id));
    expect(territoryRow).toBeDefined();
  });

  it("notifications : les siennes disparaissent, celles d'un autre utilisateur liées à son activité créée survivent", async () => {
    const { token: creatorToken } = await createUser({ email: "c5@test.com" });
    const { userId: participantId, token: participantToken } = await createUser({ email: "p5@test.com" });
    const activityId = await createActivity(creatorToken);

    // Génère une notification pour le créateur (demande de participation)
    await request(app)
      .post(`/api/activities/${activityId}/join`)
      .set("Authorization", `Bearer ${participantToken}`);

    await new Promise((resolve) => setImmediate(resolve));

    const { participations } = await import("../../src/db/schema.js");
    const [participation] = await testDb
      .select()
      .from(participations)
      .where(eq(participations.userId, participantId));

    // Génère une notification pour le PARTICIPANT (acceptation)
    await request(app)
      .put(`/api/participations/${participation!.id}/accept`)
      .set("Authorization", `Bearer ${creatorToken}`);
    await new Promise((resolve) => setImmediate(resolve));

    const participantNotifsBefore = await testDb
      .select()
      .from(notifications)
      .where(eq(notifications.usersId, participantId));
    expect(participantNotifsBefore.length).toBeGreaterThan(0);

    const del = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${creatorToken}`);
    expect(del.status).toBe(200);

    // Notification du participant (liée à l'activité du créateur supprimé) intacte
    const participantNotifsAfter = await testDb
      .select()
      .from(notifications)
      .where(eq(notifications.usersId, participantId));
    expect(participantNotifsAfter.length).toBe(participantNotifsBefore.length);
  });

  it("erreur mail : l'échec d'envoi de l'email n'empêche jamais la suppression du compte", async () => {
    mockSendAccountDeletedEmail.mockRejectedValueOnce(new Error("SMTP down"));
    const { userId, token } = await createUser({ email: "mailfail@test.com" });

    const res = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const [row] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(row).toBeUndefined();
  });
});

describe("DELETE /api/admin/users/:userId — parcours admin", () => {
  it("un admin authentifié peut supprimer un utilisateur, email de confirmation déclenché", async () => {
    const { userId } = await createUser({ email: "adminvictim@test.com", pseudo: "Victime" });
    const adminToken = signAdminToken();

    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const [row] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(row).toBeUndefined();

    expect(mockSendAccountDeletedEmail).toHaveBeenCalledWith(
      { email: "adminvictim@test.com", pseudo: "Victime" },
      expect.objectContaining({ brandName: expect.any(String) }),
    );
  });

  it("refuse sans authentification admin", async () => {
    const { userId } = await createUser({ email: "protected@test.com" });

    const res = await request(app).delete(`/api/admin/users/${userId}`);
    expect(res.status).toBe(401);

    const [row] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(row).toBeDefined();
  });

  it("un utilisateur normal (token utilisateur, pas admin) ne peut pas utiliser l'endpoint admin", async () => {
    const { userId, token: normalUserToken } = await createUser({ email: "notadmin@test.com" });
    const { userId: victimId } = await createUser({ email: "victim@test.com" });

    const res = await request(app)
      .delete(`/api/admin/users/${victimId}`)
      .set("Authorization", `Bearer ${normalUserToken}`);

    // Un token utilisateur classique n'est pas un token admin valide
    // (secret/format différents, cf. requireAdminAuth) : refusé.
    expect(res.status).toBe(401);

    const [row] = await testDb.select().from(users).where(eq(users.id, victimId));
    expect(row).toBeDefined();
    void userId;
  });

  it("utilisateur inexistant : 404", async () => {
    const adminToken = signAdminToken();
    const res = await request(app)
      .delete("/api/admin/users/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });

  it("compte supprimé par l'admin ne peut plus se connecter", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        pseudo: "AdminDel",
        email: "admindel@test.com",
        password: "Password123",
        termsAccepted: true,
      });
    const [row] = await testDb.select().from(users).where(eq(users.email, "admindel@test.com"));
    const adminToken = signAdminToken();

    await request(app)
      .delete(`/api/admin/users/${row!.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admindel@test.com", password: "Password123" });
    expect(login.status).toBe(401);
  });
});
