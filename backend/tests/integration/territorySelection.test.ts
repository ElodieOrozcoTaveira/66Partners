import { jest } from "@jest/globals";

// mail.services.ts mocké AVANT tout import de src/app.js (aucun SMTP réel).
const mockSendWelcomeEmail = jest
  .fn<(user: { email: string; pseudo: string }, brand: { brandName: string; territoryName: string }) => Promise<void>>()
  .mockResolvedValue(undefined);

jest.unstable_mockModule("../../src/services/mail.services.js", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAdminResetPasswordEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendAccountDeletedEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  sendContactEmail: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { eq } = await import("drizzle-orm");
const { resetAll, createUser, createSport, createTerritory, attachUserToTerritory, closeTestDb, testDb } =
  await import("../helpers/db.js");
const { activities, territories, userTerritories, users } = await import("../../src/db/schema.js");
const { signAdminToken } = await import("../../src/utils/adminJwt.js");

const registerBody = (email: string, extra: Record<string, unknown> = {}) => ({
  pseudo: "Territorial",
  email,
  password: "Password123",
  termsAccepted: true,
  ...extra,
});

async function membershipCodes(userId: string): Promise<string[]> {
  const rows = await testDb
    .select({ code: territories.code, isDefault: userTerritories.isDefault })
    .from(userTerritories)
    .innerJoin(territories, eq(territories.id, userTerritories.territoryId))
    .where(eq(userTerritories.userId, userId));
  return rows.map((r) => `${r.code}${r.isDefault ? "*" : ""}`).sort();
}

// La base de test est persistante et non tronquée pour les territoires : la
// ligne "34" a pu être créée par d'anciens tests avec des valeurs génériques.
// On la ramène à sa définition canonique (TERRITORY_SEEDS) avant chaque test.
async function resetTerritory34(isActive: boolean) {
  const { TERRITORY_SEEDS } = await import("../../src/db/seed-territories.js");
  const seed34 = TERRITORY_SEEDS.find((t) => t.code === "34")!;
  await createTerritory({ code: "34", isActive });
  await testDb
    .update(territories)
    .set({
      name: seed34.name,
      slug: seed34.slug,
      brandName: seed34.brandName,
      inseeDepartmentCode: seed34.inseeDepartmentCode,
      tagline: seed34.tagline,
      assetsPath: seed34.assetsPath,
      isActive,
    })
    .where(eq(territories.code, "34"));
}

beforeEach(async () => {
  await resetAll();
  mockSendWelcomeEmail.mockClear();
  await resetTerritory34(true);
});

afterAll(async () => {
  // Le 34 est seedé inactif : on le remet dans son état d'origine.
  await resetTerritory34(false);
  await closeTestDb();
});

describe("Inscription et territoire principal choisi", () => {
  it("rattache le nouvel utilisateur UNIQUEMENT au territoire choisi (34), même si le 66 est aussi actif", async () => {
    const res = await request(app).post("/api/auth/register").send(registerBody("t34@test.com", { territoryCode: "34" }));

    expect(res.status).toBe(201);
    expect(await membershipCodes(res.body.user.id)).toEqual(["34*"]);
  });

  it("rattache uniquement au 66 quand le 66 est choisi (jamais au 34 automatiquement)", async () => {
    const res = await request(app).post("/api/auth/register").send(registerBody("t66@test.com", { territoryCode: "66" }));

    expect(res.status).toBe(201);
    expect(await membershipCodes(res.body.user.id)).toEqual(["66*"]);
  });

  it("sans territoryCode (ancien client) : premier territoire actif, un seul rattachement", async () => {
    const res = await request(app).post("/api/auth/register").send(registerBody("tnone@test.com"));

    expect(res.status).toBe(201);
    expect(await membershipCodes(res.body.user.id)).toEqual(["66*"]);
  });

  it("refuse un territoire inactif (400) sans créer de compte", async () => {
    await createTerritory({ code: "34", isActive: false });

    const res = await request(app).post("/api/auth/register").send(registerBody("tinactive@test.com", { territoryCode: "34" }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("TERRITORY_NOT_ACTIVE");
    const rows = await testDb.select().from(users).where(eq(users.email, "tinactive@test.com"));
    expect(rows).toHaveLength(0);
  });

  it("refuse un territoire inconnu (404) sans créer de compte", async () => {
    const res = await request(app).post("/api/auth/register").send(registerBody("tunknown@test.com", { territoryCode: "99" }));

    expect(res.status).toBe(404);
    const rows = await testDb.select().from(users).where(eq(users.email, "tunknown@test.com"));
    expect(rows).toHaveLength(0);
  });

  it("l'email de bienvenue utilise le branding du territoire choisi", async () => {
    await request(app).post("/api/auth/register").send(registerBody("tbrand@test.com", { territoryCode: "34" }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmail.mock.calls[0]![1]).toEqual({
      brandName: "34Partners",
      territoryName: "Hérault",
    });
  });
});

describe("GET /api/territories — configuration générique par territoire", () => {
  it("expose code INSEE, tagline et dossier d'assets du territoire", async () => {
    const res = await request(app).get("/api/territories/34");

    expect(res.status).toBe(200);
    expect(res.body.territory).toMatchObject({
      code: "34",
      brandName: "34Partners",
      inseeDepartmentCode: "34",
      assetsPath: "/34partners",
    });
    expect(res.body.territory.tagline).toEqual(expect.any(String));
  });
});

describe("Filtre territoire de l'admin (Tous | 66 | 34)", () => {
  async function seedTwoTerritories() {
    const sportId = await createSport("Filtre");
    const { userId: u66, token: t66 } = await createUser({ email: "u66@test.com" });
    const { userId: u34, token: t34 } = await createUser({ email: "u34@test.com", territoryCode: "34" });
    void t34;
    const territory34 = await createTerritory({ code: "34", isActive: true });
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${t66}`)
      .send({ title: "Act 66", city: "Perpignan", startDate: new Date(Date.now() + 86400000).toISOString(), levelRequired: "BEGINNER", maxParticipants: 4, sportId });
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${t34}`)
      .send({ title: "Act 34", city: "Montpellier", startDate: new Date(Date.now() + 86400000).toISOString(), levelRequired: "BEGINNER", maxParticipants: 4, sportId, territoryId: territory34.id });
    return { u66, u34 };
  }

  const auth = () => ({ Authorization: `Bearer ${signAdminToken()}` });

  it("liste des utilisateurs : Tous, 66 et 34", async () => {
    const { u66, u34 } = await seedTwoTerritories();

    const all = await request(app).get("/api/admin/users").set(auth());
    const only66 = await request(app).get("/api/admin/users?territory=66").set(auth());
    const only34 = await request(app).get("/api/admin/users?territory=34").set(auth());

    const ids = (r: { body: { users: { id: string }[] } }) => r.body.users.map((u) => u.id);
    expect(ids(all)).toEqual(expect.arrayContaining([u66, u34]));
    expect(ids(only66)).toEqual([u66]);
    expect(ids(only34)).toEqual([u34]);
    expect(only34.body.users[0].territories).toEqual(["34"]);
  });

  it("liste des activités filtrée par territoire", async () => {
    await seedTwoTerritories();

    const only34 = await request(app).get("/api/admin/activities?territory=34").set(auth());
    const only66 = await request(app).get("/api/admin/activities?territory=66").set(auth());
    const all = await request(app).get("/api/admin/activities").set(auth());

    expect(only34.body.activities.map((a: { title: string }) => a.title)).toEqual(["Act 34"]);
    expect(only66.body.activities.map((a: { title: string }) => a.title)).toEqual(["Act 66"]);
    expect(all.body.activities).toHaveLength(2);
  });

  it("statistiques filtrées par territoire (utilisateurs, activités)", async () => {
    await seedTwoTerritories();

    const all = await request(app).get("/api/admin/stats/overview?range=7d").set(auth());
    const only34 = await request(app).get("/api/admin/stats/overview?range=7d&territory=34").set(auth());

    expect(all.body.overview.users.value).toBe(2);
    expect(only34.body.overview.users.value).toBe(1);
    expect(only34.body.overview.activities.value).toBe(1);
  });

  it("territoire inconnu : 404 ; sans authentification admin : 401", async () => {
    const unknown = await request(app).get("/api/admin/users?territory=99").set(auth());
    expect(unknown.status).toBe(404);

    const anon = await request(app).get("/api/admin/users?territory=34");
    expect(anon.status).toBe(401);
  });
});

describe("Seed des territoires", () => {
  it("le 34 existe et n'est jamais actif par défaut ; aucun utilisateur existant n'y est rattaché", async () => {
    await createTerritory({ code: "34", isActive: false });
    const { seedTerritories } = await import("../../src/db/seed-territories.js");
    const { userId } = await createUser({ email: "seedcheck@test.com" });
    await seedTerritories();

    const [t34] = await testDb.select().from(territories).where(eq(territories.code, "34"));
    expect(t34!.isActive).toBe(false);
    expect(await membershipCodes(userId)).toEqual(["66*"]);
    void attachUserToTerritory;
    void activities;
  });
});
