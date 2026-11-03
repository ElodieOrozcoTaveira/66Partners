import { jest } from "@jest/globals";

const mockSendMail = jest.fn<(options: unknown) => Promise<unknown>>().mockResolvedValue(undefined);

// Aucune credential SMTP en test : nodemailer est mocké avant l'import de
// l'app, l'alerte email de signalement est vérifiée sur ce mock.
jest.unstable_mockModule("nodemailer", () => ({
  default: { createTransport: jest.fn(() => ({ sendMail: mockSendMail })) },
}));

const { default: request } = await import("supertest");
const { sql } = await import("drizzle-orm");
const { default: app } = await import("../../src/app.js");
const { signAdminToken } = await import("../../src/utils/adminJwt.js");
const { resetAll, createUser, createSport, closeTestDb, testDb } = await import("../helpers/db.js");

type TestUser = { userId: string; token: string };

const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });
const admin = () => ({ Authorization: `Bearer ${signAdminToken()}` });

let sportId: string;
let alice: TestUser; // bloque bob
let bob: TestUser;
let carol: TestUser; // organisatrice tierce, bob et alice y participent
let aliceActivity: string;
let carolActivity: string;

async function createActivity(user: TestUser, startDate = inDays(5)): Promise<string> {
  const res = await request(app)
    .post("/api/activities")
    .set(auth(user))
    .send({ title: `Sortie de test`, city: "Perpignan", startDate, levelRequired: "BEGINNER", maxParticipants: 6, sportId });
  expect(res.status).toBe(201);
  return res.body.activity.id as string;
}

async function acceptInto(activityId: string, user: TestUser): Promise<void> {
  const join = await request(app).post(`/api/activities/${activityId}/join`).set(auth(user));
  expect([200, 201]).toContain(join.status);
  await testDb.execute(
    sql`update participations set status = 'ACCEPTED' where user_id = ${user.userId} and activity_id = ${activityId}`
  );
}

async function groupConversation(activityId: string, user: TestUser): Promise<string> {
  const res = await request(app).get(`/api/activities/${activityId}/conversation?territory=66`).set(auth(user));
  expect(res.status).toBe(200);
  return res.body.conversation.id as string;
}

async function sendMessage(conversationId: string, user: TestUser, contenu: string): Promise<string> {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set(auth(user))
    .send({ contenu, territory: "66" });
  expect(res.status).toBe(201);
  return res.body.message.id as string;
}

async function waitForMail(): Promise<void> {
  for (let i = 0; i < 50 && mockSendMail.mock.calls.length === 0; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

const originalRecovery = process.env.ADMIN_RECOVERY_EMAIL;

beforeEach(async () => {
  await resetAll();
  mockSendMail.mockClear();
  process.env.ADMIN_RECOVERY_EMAIL = "admin@test.com";
  sportId = await createSport("Trail");
  alice = await createUser({ pseudo: "alice" });
  bob = await createUser({ pseudo: "bob" });
  carol = await createUser({ pseudo: "carol" });
  aliceActivity = await createActivity(alice);
  carolActivity = await createActivity(carol);
});

afterAll(async () => {
  if (originalRecovery === undefined) delete process.env.ADMIN_RECOVERY_EMAIL;
  else process.env.ADMIN_RECOVERY_EMAIL = originalRecovery;
  await resetAll();
  await closeTestDb();
});

describe("POST /api/reports", () => {
  it("exige d'être connecté et valide le corps", async () => {
    expect((await request(app).post("/api/reports").send({})).status).toBe(401);
    const invalid = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "PROFILE", targetId: bob.userId, reason: "PAS_UN_MOTIF" });
    expect(invalid.status).toBe(400);
  });

  it("enregistre un signalement de profil, prévient l'admin par email et refuse le doublon", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "PROFILE", targetId: bob.userId, reason: "HARASSMENT", details: "Messages <b>insultants</b>" });
    expect(res.status).toBe(201);

    await waitForMail();
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0]![0] as { to: string; html: string };
    expect(mail.to).toBe("admin@test.com");
    expect(mail.html).toContain("bob");
    // Contenu saisi par un membre : échappé dans l'email.
    expect(mail.html).toContain("&lt;b&gt;insultants&lt;/b&gt;");

    const again = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "PROFILE", targetId: bob.userId, reason: "SPAM" });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("ALREADY_REPORTED");
  });

  it("refuse de se signaler soi-même", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "PROFILE", targetId: alice.userId, reason: "OTHER" });
    expect(res.status).toBe(400);
  });

  it("détermine l'auteur d'un message côté serveur et refuse un non-membre", async () => {
    await acceptInto(carolActivity, bob);
    const conversationId = await groupConversation(carolActivity, carol);
    const messageId = await sendMessage(conversationId, bob, "Message signalé");

    // alice n'est pas dans l'activité : le message lui est introuvable.
    const outsider = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "MESSAGE", targetId: messageId, reason: "INAPPROPRIATE" });
    expect(outsider.status).toBe(404);

    const member = await request(app)
      .post("/api/reports")
      .set(auth(carol))
      .send({ context: "MESSAGE", targetId: messageId, reason: "INAPPROPRIATE" });
    expect(member.status).toBe(201);

    const list = await request(app).get("/api/admin/reports").set(admin());
    expect(list.status).toBe(200);
    expect(list.body.reports[0]).toMatchObject({
      context: "MESSAGE",
      targetExcerpt: "Message signalé",
      status: "OPEN",
      reporter: { pseudo: "carol" },
      reportedUser: { pseudo: "bob", openReports: 1 },
    });
  });

  it("signale une activité au nom de son organisatrice", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set(auth(bob))
      .send({ context: "ACTIVITY", targetId: aliceActivity, reason: "SPAM" });
    expect(res.status).toBe(201);
    const list = await request(app).get("/api/admin/reports").set(admin());
    expect(list.body.reports[0].reportedUser.pseudo).toBe("alice");
  });
});

describe("Admin : signalements", () => {
  it("est réservé à l'admin", async () => {
    expect((await request(app).get("/api/admin/reports")).status).toBe(401);
    expect((await request(app).get("/api/admin/reports").set(auth(alice))).status).toBe(401);
  });

  it("marque un signalement comme traité puis le filtre par statut", async () => {
    const created = await request(app)
      .post("/api/reports")
      .set(auth(alice))
      .send({ context: "PROFILE", targetId: bob.userId, reason: "SPAM" });
    const reportId = created.body.reportId as string;

    const patch = await request(app).patch(`/api/admin/reports/${reportId}`).set(admin()).send({ status: "RESOLVED" });
    expect(patch.status).toBe(200);

    const open = await request(app).get("/api/admin/reports?status=OPEN").set(admin());
    expect(open.body.reports).toHaveLength(0);
    const resolved = await request(app).get("/api/admin/reports?status=RESOLVED").set(admin());
    expect(resolved.body.reports[0]).toMatchObject({ id: reportId, status: "RESOLVED" });
    expect(resolved.body.reports[0].resolvedAt).not.toBeNull();

    const missing = await request(app)
      .patch("/api/admin/reports/00000000-0000-4000-8000-000000000000")
      .set(admin())
      .send({ status: "RESOLVED" });
    expect(missing.status).toBe(404);
  });
});

describe("Blocage", () => {
  it("refuse de se bloquer soi-même ou un compte inexistant", async () => {
    expect((await request(app).post(`/api/users/${alice.userId}/block`).set(auth(alice))).status).toBe(400);
    expect(
      (await request(app).post("/api/users/00000000-0000-4000-8000-000000000000/block").set(auth(alice))).status
    ).toBe(404);
  });

  it("rend les deux membres invisibles l'un pour l'autre, puis le déblocage rétablit tout", async () => {
    await acceptInto(aliceActivity, bob);
    expect((await request(app).post(`/api/users/${bob.userId}/block`).set(auth(alice))).status).toBe(200);

    // Profils : introuvables dans les deux sens.
    expect((await request(app).get(`/api/users/${bob.userId}`).set(auth(alice))).status).toBe(404);
    expect((await request(app).get(`/api/users/${alice.userId}`).set(auth(bob))).status).toBe(404);
    expect((await request(app).get(`/api/sports/favorites/${alice.userId}`).set(auth(bob))).status).toBe(404);
    // Un tiers voit toujours les deux.
    expect((await request(app).get(`/api/users/${alice.userId}`).set(auth(carol))).status).toBe(200);

    // Activités d'alice : absentes de la liste de bob, introuvables, impossibles à rejoindre.
    const list = await request(app).get("/api/activities?territory=66").set(auth(bob));
    expect(list.status).toBe(200);
    const ids = list.body.activities.map((a: { id: string }) => a.id);
    expect(ids).not.toContain(aliceActivity);
    expect(ids).toContain(carolActivity);
    // Sans connexion, la liste reste complète (route publique).
    const anonymous = await request(app).get("/api/activities?territory=66");
    expect(anonymous.body.activities.map((a: { id: string }) => a.id)).toContain(aliceActivity);

    expect((await request(app).get(`/api/activities/${aliceActivity}`).set(auth(bob))).status).toBe(404);
    // La participation à venir de bob chez alice a été retirée.
    const rows = (
      await testDb.execute(
        sql`select id from participations where user_id = ${bob.userId} and activity_id = ${aliceActivity}`
      )
    ).rows;
    expect(rows).toHaveLength(0);
    expect((await request(app).post(`/api/activities/${aliceActivity}/join`).set(auth(bob))).status).toBe(404);

    // Liste des bloqués : seulement pour celle qui a bloqué.
    const blocks = await request(app).get("/api/users/me/blocks").set(auth(alice));
    expect(blocks.body.blocks).toEqual([expect.objectContaining({ userId: bob.userId, pseudo: "bob" })]);
    expect((await request(app).get("/api/users/me/blocks").set(auth(bob))).body.blocks).toEqual([]);

    expect((await request(app).delete(`/api/users/${bob.userId}/block`).set(auth(alice))).status).toBe(200);
    expect((await request(app).get(`/api/users/${alice.userId}`).set(auth(bob))).status).toBe(200);
    expect((await request(app).get(`/api/activities/${aliceActivity}`).set(auth(bob))).status).toBe(200);
  });

  it("masque les messages et la présence du membre bloqué dans une activité commune", async () => {
    await acceptInto(carolActivity, alice);
    await acceptInto(carolActivity, bob);
    const conversationId = await groupConversation(carolActivity, carol);
    await sendMessage(conversationId, bob, "Message de bob");
    await sendMessage(conversationId, carol, "Message de carol");

    await request(app).post(`/api/users/${bob.userId}/block`).set(auth(alice));

    const forAlice = await request(app).get(`/api/conversations/${conversationId}/messages?territory=66`).set(auth(alice));
    expect(forAlice.status).toBe(200);
    expect(forAlice.body.messages.map((m: { contenu: string }) => m.contenu)).toEqual(["Message de carol"]);

    // Dans l'autre sens aussi : bob ne voit plus les messages d'alice.
    await sendMessage(conversationId, alice, "Message d'alice");
    const forBob = await request(app).get(`/api/conversations/${conversationId}/messages?territory=66`).set(auth(bob));
    expect(forBob.body.messages.map((m: { contenu: string }) => m.contenu)).not.toContain("Message d'alice");

    // Carol voit toujours tout le monde.
    const forCarol = await request(app).get(`/api/conversations/${conversationId}/messages?territory=66`).set(auth(carol));
    expect(forCarol.body.messages).toHaveLength(3);

    const participants = await request(app).get(`/api/activities/${carolActivity}/participations`).set(auth(alice));
    expect(participants.status).toBe(200);
    expect(participants.body.participations.map((p: { userId: string }) => p.userId)).not.toContain(bob.userId);
  });

  it("empêche l'organisatrice d'accepter un membre qu'elle a bloqué", async () => {
    const join = await request(app).post(`/api/activities/${aliceActivity}/join`).set(auth(bob));
    const participationId = join.body.participation.id as string;
    await testDb.execute(sql`insert into user_blocks (blocker_id, blocked_id) values (${alice.userId}, ${bob.userId})`);

    const accept = await request(app).put(`/api/participations/${participationId}/accept`).set(auth(alice));
    expect(accept.status).toBe(403);
    expect(accept.body.code).toBe("BLOCKED_MEMBER");
  });
});
