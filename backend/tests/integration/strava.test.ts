import { jest } from "@jest/globals";

const mockSendStravaLinkedEmail = jest
  .fn<(user: { email: string; pseudo: string }, brand: unknown, athleteName: string | null) => Promise<void>>()
  .mockResolvedValue(undefined);

// Aucun envoi SMTP réel en test (même pattern que accountDeletion.test.ts).
jest.unstable_mockModule("../../src/services/mail.services.js", () => ({
  sendStravaLinkedEmail: mockSendStravaLinkedEmail,
  sendAccountDeletedEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAdminResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendContactEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendReportAlertEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const request = (await import("supertest")).default;
const { eq } = await import("drizzle-orm");
const { default: app } = await import("../../src/app.js");
const { activities, participations, sports, stravaAccounts, stravaMeetingValidations } = await import(
  "../../src/db/schema.js"
);
const { encryptSecret, decryptSecret } = await import("../../src/utils/secretBox.js");
const { createStravaState } = await import("../../src/utils/stravaState.js");
const { stravaLinkedEmailTemplate } = await import("../../src/services/emailTemplates/stravaLinked.template.js");
const { closeTestDb, createSport, createTerritory, createUser, resetAll, testDb } = await import("../helpers/db.js");

process.env.STRAVA_CLIENT_ID = "12345";
process.env.STRAVA_CLIENT_SECRET = "secret";
process.env.STRAVA_REDIRECT_URI = "http://localhost:3000/api/strava/callback";
process.env.STRAVA_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.FRONTEND_URL = "http://front.test";

async function waitFor(condition: () => boolean, timeoutMs = 2000) {
  const end = Date.now() + timeoutMs;
  while (!condition() && Date.now() < end) await new Promise((resolve) => setTimeout(resolve, 20));
}

type FetchCall = { url: string; init: RequestInit | undefined };
let calls: FetchCall[] = [];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response) {
  return jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();
    calls.push({ url, init });
    return handler(url, init);
  });
}

async function linkStrava(userId: string, expiresInMs = 60 * 60 * 1000) {
  await testDb.insert(stravaAccounts).values({
    userId,
    stravaAthleteId: Math.floor(Math.random() * 1e9),
    accessTokenEncrypted: encryptSecret("old-access"),
    refreshTokenEncrypted: encryptSecret("old-refresh"),
    expiresAt: new Date(Date.now() + expiresInMs),
    scope: "read,activity:read_all,activity:write",
  });
}

async function createOuting(creatorId: string, startDate: Date, status: "PENDING" | "CANCELLED" = "PENDING") {
  const [existing] = await testDb.select({ id: sports.id }).from(sports).where(eq(sports.name, "Trail"));
  const sportId = existing?.id ?? (await createSport("Trail"));
  const territory = await createTerritory({ code: "STRAVA1", slug: "strava-test", brandName: "66Partners" });
  const [activity] = await testDb
    .insert(activities)
    .values({
      title: "Sortie trail",
      city: "Perpignan",
      startDate,
      levelRequired: "BEGINNER",
      maxParticipants: 4,
      status,
      sportId,
      creatorId,
      territoryId: territory.id,
    })
    .returning({ id: activities.id });
  return activity!.id;
}

beforeEach(async () => {
  await resetAll();
  calls = [];
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Connexion Strava", () => {
  it("donne l'URL d'autorisation avec le scope d'écriture et un state signé", async () => {
    const user = await createUser();
    const res = await request(app).get("/api/strava/connect").set("Authorization", `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    const url = new URL(res.body.url);
    expect(url.origin + url.pathname).toBe("https://www.strava.com/oauth/authorize");
    expect(url.searchParams.get("scope")).toContain("activity:write");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("approval_prompt")).toBe("force");

    const mobile = await request(app)
      .get("/api/strava/connect?mobile=1")
      .set("Authorization", `Bearer ${user.token}`);
    expect(new URL(mobile.body.url).pathname).toBe("/oauth/mobile/authorize");
  });

  it("renvoie 503 si Strava n'est pas configuré", async () => {
    const user = await createUser();
    const saved = process.env.STRAVA_CLIENT_SECRET;
    delete process.env.STRAVA_CLIENT_SECRET;
    const res = await request(app).get("/api/strava/connect").set("Authorization", `Bearer ${user.token}`);
    process.env.STRAVA_CLIENT_SECRET = saved;
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("STRAVA_NOT_CONFIGURED");
  });

  it("échange le code, chiffre les jetons et met à jour le compte existant", async () => {
    const user = await createUser();
    mockFetch(() =>
      json({
        access_token: "acc-1",
        refresh_token: "ref-1",
        expires_at: 2_000_000_000,
        athlete: { id: 42, firstname: "Léa", lastname: "Martin", profile_medium: "https://cdn.test/lea.jpg" },
      }),
    );
    const callback = (code: string) =>
      request(app).get("/api/strava/callback").query({
        code,
        state: createStravaState(user.userId),
        scope: "read,activity:read_all,activity:write",
      });

    const first = await callback("code-1");
    expect(first.status).toBe(302);
    expect(first.headers.location).toBe("http://front.test/profile?strava=connected");
    expect(JSON.parse(String(calls[0]!.init!.body))).toMatchObject({
      client_id: "12345",
      code: "code-1",
      grant_type: "authorization_code",
    });

    await waitFor(() => mockSendStravaLinkedEmail.mock.calls.length > 0);
    expect(mockSendStravaLinkedEmail).toHaveBeenCalledTimes(1);
    expect(mockSendStravaLinkedEmail.mock.calls[0]![0]).toMatchObject({ email: expect.any(String) });
    expect(mockSendStravaLinkedEmail.mock.calls[0]![2]).toBe("Léa Martin");

    await callback("code-2");
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(mockSendStravaLinkedEmail).toHaveBeenCalledTimes(1);
    const rows = await testDb.select().from(stravaAccounts).where(eq(stravaAccounts.userId, user.userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.stravaAthleteId).toBe(42);
    expect(rows[0]!.athleteName).toBe("Léa Martin");
    expect(rows[0]!.athleteAvatarUrl).toBe("https://cdn.test/lea.jpg");
    expect(rows[0]!.accessTokenEncrypted).not.toContain("acc-1");
    expect(decryptSecret(rows[0]!.accessTokenEncrypted)).toBe("acc-1");
  });

  it("refuse un state falsifié ou un scope sans écriture", async () => {
    const user = await createUser();
    const fetchSpy = mockFetch(() => json({}));

    const forged = await request(app)
      .get("/api/strava/callback")
      .query({ code: "c", state: "faux.state", scope: "read,activity:read_all,activity:write" });
    expect(forged.headers.location).toContain("reason=STRAVA_INVALID_STATE");

    const readOnly = await request(app)
      .get("/api/strava/callback")
      .query({ code: "c", state: createStravaState(user.userId), scope: "read" });
    expect(readOnly.headers.location).toContain("reason=STRAVA_SCOPE_MISSING");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuse un compte Strava déjà relié à un autre membre", async () => {
    const owner = await createUser();
    const other = await createUser();
    await testDb.insert(stravaAccounts).values({
      userId: owner.userId,
      stravaAthleteId: 42,
      accessTokenEncrypted: encryptSecret("a"),
      refreshTokenEncrypted: encryptSecret("r"),
      expiresAt: new Date(Date.now() + 3_600_000),
      scope: "activity:write",
    });
    mockFetch(() => json({ access_token: "a", refresh_token: "r", expires_at: 2_000_000_000, athlete: { id: 42 } }));
    const res = await request(app)
      .get("/api/strava/callback")
      .query({ code: "c", state: createStravaState(other.userId), scope: "read,activity:read_all,activity:write" });
    expect(res.headers.location).toContain("reason=STRAVA_ALREADY_LINKED");
  });

  it("indique le statut et délie le compte", async () => {
    const user = await createUser();
    await linkStrava(user.userId);
    mockFetch(() => json({}));
    const auth = { Authorization: `Bearer ${user.token}` };

    expect((await request(app).get("/api/strava/status").set(auth)).body.linked).toBe(true);
    const visitor = await createUser();
    const seen = await request(app)
      .get(`/api/strava/users/${user.userId}/status`)
      .set("Authorization", `Bearer ${visitor.token}`);
    expect(seen.body).toEqual({ success: true, linked: true });
    expect((await request(app).delete("/api/strava").set(auth)).status).toBe(204);
    expect(calls[0]!.url).toBe("https://www.strava.com/oauth/deauthorize");
    expect((await request(app).get("/api/strava/status").set(auth)).body.linked).toBe(false);
  });
});

describe("Mail de liaison Strava", () => {
  it("échappe le pseudo et pointe vers le profil", () => {
    const html = stravaLinkedEmailTemplate(
      "<b>Léa</b>",
      { brandName: "34Partners", territoryName: "Hérault" },
      { profileUrl: "http://front.test/profile", athleteName: "Léa Martin" },
    );
    expect(html).toContain("&lt;b&gt;Léa&lt;/b&gt;");
    expect(html).not.toContain("<b>Léa</b>");
    expect(html).toContain('href="http://front.test/profile"');
    expect(html).toContain("Rencontre réussie grâce à 34Partners");
  });
});

describe("Valider notre rencontre", () => {
  const start = new Date(Date.now() - 4 * 60 * 60 * 1000);

  async function setupOuting() {
    const creator = await createUser({ pseudo: "Léa" });
    const partner = await createUser({ pseudo: "Tom" });
    const pending = await createUser({ pseudo: "Max" });
    const activityId = await createOuting(creator.userId, start);
    await testDb.insert(participations).values([
      { userId: partner.userId, activityId, status: "ACCEPTED" },
      { userId: pending.userId, activityId, status: "PENDING" },
    ]);
    return { creator, partner, pending, activityId };
  }

  function stravaApi(description: string | null = "Belle sortie") {
    return mockFetch((url, init) => {
      if (url.startsWith("https://www.strava.com/oauth/token")) {
        return json({ access_token: "new-access", refresh_token: "new-refresh", expires_at: 2_000_000_000 });
      }
      if (url.includes("/athlete/activities")) {
        return json([
          { id: 111, name: "Matin", start_date: new Date(start.getTime() - 2 * 3_600_000).toISOString() },
          { id: 222, name: "Trail", start_date: new Date(start.getTime() + 10 * 60_000).toISOString() },
        ]);
      }
      if (url.endsWith("/activities/222") && init?.method === "PUT") {
        return json({ id: 222, ...JSON.parse(String(init.body)) });
      }
      if (url.endsWith("/activities/222")) {
        return json({ id: 222, name: "Trail", start_date: start.toISOString(), description });
      }
      return json({ message: "Not Found" }, 404);
    });
  }

  const validate = (token: string, activityId: string) =>
    request(app).post(`/api/strava/activities/${activityId}/validate`).set("Authorization", `Bearer ${token}`);

  it("renomme l'activité Strava la plus proche de l'heure de la sortie", async () => {
    const { creator, activityId } = await setupOuting();
    await linkStrava(creator.userId);
    stravaApi();

    const res = await validate(creator.token, activityId);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ stravaActivityId: 222, stravaUrl: "https://www.strava.com/activities/222" });

    const put = calls.find((call) => call.init?.method === "PUT")!;
    expect(put.url).toBe("https://www.strava.com/api/v3/activities/222");
    expect(put.init!.headers).toMatchObject({ Authorization: "Bearer old-access" });
    expect(JSON.parse(String(put.init!.body))).toEqual({
      name: "Sortie trail avec Tom",
      description: "Belle sortie\n\nRencontre réussie grâce à 66Partners ! 🤝",
    });

    const state = await request(app)
      .get(`/api/strava/activities/${activityId}/validation`)
      .set("Authorization", `Bearer ${creator.token}`);
    expect(state.body).toMatchObject({ validated: true, stravaUrl: "https://www.strava.com/activities/222" });

    const again = await validate(creator.token, activityId);
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("ALREADY_VALIDATED");
  });

  it("rafraîchit un jeton qui expire dans moins de 5 minutes", async () => {
    const { partner, activityId } = await setupOuting();
    await linkStrava(partner.userId, 2 * 60 * 1000);
    stravaApi(null);

    const res = await validate(partner.token, activityId);
    expect(res.status).toBe(200);
    expect(JSON.parse(String(calls[0]!.init!.body))).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "old-refresh",
    });
    const put = calls.find((call) => call.init?.method === "PUT")!;
    expect(put.init!.headers).toMatchObject({ Authorization: "Bearer new-access" });
    expect(JSON.parse(String(put.init!.body)).name).toBe("Sortie trail avec Léa");

    const [account] = await testDb.select().from(stravaAccounts).where(eq(stravaAccounts.userId, partner.userId));
    expect(decryptSecret(account!.refreshTokenEncrypted)).toBe("new-refresh");
    expect(account!.expiresAt.getTime()).toBe(2_000_000_000 * 1000);
  });

  it("refuse un membre non accepté, un compte non relié et une sortie future", async () => {
    const { pending, creator, activityId } = await setupOuting();
    await linkStrava(pending.userId);
    const fetchSpy = stravaApi();

    expect((await validate(pending.token, activityId)).body.code).toBe("NOT_A_MEMBER");
    expect((await validate(creator.token, activityId)).body.code).toBe("STRAVA_NOT_LINKED");

    const future = await createOuting(creator.userId, new Date(Date.now() + 3_600_000));
    await linkStrava(creator.userId);
    expect((await validate(creator.token, future)).body.code).toBe("ACTIVITY_NOT_STARTED");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("signale l'absence d'activité Strava sans rien enregistrer", async () => {
    const { creator, activityId } = await setupOuting();
    await linkStrava(creator.userId);
    mockFetch(() => json([]));

    const res = await validate(creator.token, activityId);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("STRAVA_ACTIVITY_NOT_FOUND");
    expect(await testDb.select().from(stravaMeetingValidations)).toHaveLength(0);
  });

  it("transmet une erreur claire si Strava refuse la modification", async () => {
    const { creator, activityId } = await setupOuting();
    await linkStrava(creator.userId);
    mockFetch((url, init) => {
      if (url.includes("/athlete/activities")) return json([{ id: 222, name: "T", start_date: start.toISOString() }]);
      if (init?.method === "PUT") return json({ message: "Forbidden" }, 403);
      return json({ id: 222, name: "T", start_date: start.toISOString(), description: "" });
    });

    const res = await validate(creator.token, activityId);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("STRAVA_UPDATE_FAILED");
    expect(await testDb.select().from(stravaMeetingValidations)).toHaveLength(0);
  });
});
