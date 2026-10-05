import request from "supertest";
import { eq, sql } from "drizzle-orm";
import app from "../../src/app.js";
import { userTerritories } from "../../src/db/schema.js";
import {
  resetAll,
  createUser,
  createSport,
  createTerritory,
  attachUserToTerritory,
  testDb,
  closeTestDb,
} from "../helpers/db.js";

let token: string;
let sportId: string;

const futureDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

beforeEach(async () => {
  await resetAll();
  // territoryCode explicite plutôt que de compter sur "premier territoire
  // actif par createdAt" : sur une base fraîchement migrée (jamais passée
  // par seed-territories.ts), la migration 20260921131458 insère "34" sans
  // que "66" existe encore, donnant à "34" un createdAt antérieur — ce test
  // doit rester déterministe indépendamment de cet historique de seed.
  ({ token } = await createUser({ email: "creator@test.com", territoryCode: "66" }));
  sportId = await createSport("Running");
});

afterAll(async () => {
  await closeTestDb();
});

describe("GET /api/territories", () => {
  it("liste les territoires et inclut le 66, actif", async () => {
    const res = await request(app).get("/api/territories");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const territory66 = res.body.territories.find(
      (t: { code: string }) => t.code === "66"
    );
    expect(territory66).toBeDefined();
    expect(territory66.isActive).toBe(true);
  });

  it("n'expose jamais un territoire inactif (route publique — cf. audit P-04)", async () => {
    const inactiveTerritory = await createTerritory({ code: "INACTV", isActive: false });

    const res = await request(app).get("/api/territories");

    expect(res.status).toBe(200);
    expect(
      res.body.territories.some((t: { code: string }) => t.code === inactiveTerritory.code)
    ).toBe(false);
  });
});

describe("GET /api/territories/:code", () => {
  it("renvoie le territoire 66", async () => {
    const res = await request(app).get("/api/territories/66");

    expect(res.status).toBe(200);
    expect(res.body.territory).toMatchObject({ code: "66", isActive: true });
  });

  it("renvoie 404 pour un code inconnu", async () => {
    const res = await request(app).get("/api/territories/00");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("TERRITORY_NOT_FOUND");
  });
});

describe("Rattachement utilisateur/territoire", () => {
  it("un utilisateur n'est jamais rattaché deux fois au même territoire", async () => {
    const { userId } = await createUser({ email: "double@test.com" });

    const [{ count }] = await testDb
      .select({ count: sql<number>`count(*)` })
      .from(userTerritories)
      .where(eq(userTerritories.userId, userId));

    // createUser rattache déjà l'utilisateur (comme à l'inscription) : un
    // second rattachement explicite ne doit rien dupliquer (onConflictDoNothing).
    expect(Number(count)).toBe(1);
  });
});

describe("POST /api/activities et territoire", () => {
  it("une activité créée sans territoryId hérite du territoire par défaut du créateur", async () => {
    const territoryRes = await request(app).get("/api/territories/66");
    const territory66Id = territoryRes.body.territory.id as string;

    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    expect(res.status).toBe(201);
    expect(res.body.activity.territoryId).toBe(territory66Id);
  });

  it("refuse la création (403) si l'utilisateur n'est pas membre du territoire ciblé", async () => {
    const otherTerritory = await createTerritory({ code: "34" });

    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ territoryId: otherTerritory.id }));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("NOT_TERRITORY_MEMBER");
  });

  it("crée l'activité dans le territoire actif transmis (34) pour un utilisateur membre de 66 et 34", async () => {
    const { userId: multiUserId, token: multiToken } = await createUser({
      email: "multi34@test.com",
    });
    const territory34 = await createTerritory({ code: "34" });
    await attachUserToTerritory(multiUserId, territory34.id);

    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${multiToken}`)
      .send(validActivity({ territoryId: territory34.id }));

    expect(res.status).toBe(201);
    expect(res.body.activity.territoryId).toBe(territory34.id);
  });

  it("filtre les activités par territoire", async () => {
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    const res = await request(app).get("/api/activities?territory=66");

    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);

    const emptyRes = await request(app).get("/api/activities?territory=34");
    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.activities).toEqual([]);
  });

  it("refuse (400) une requête sans territoire : l'isolation ne dépend jamais uniquement de l'appelant (cf. audit P-01)", async () => {
    const territory34 = await createTerritory({ code: "34" });
    const { userId: creator34Id, token: creator34Token } = await createUser({
      email: "creator34list@test.com",
    });
    await attachUserToTerritory(creator34Id, territory34.id);

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creator34Token}`)
      .send(validActivity({ territoryId: territory34.id }));

    const noFilterRes = await request(app).get("/api/activities");
    expect(noFilterRes.status).toBe(400);

    const emptyTerritoryRes = await request(app).get("/api/activities?territory=");
    expect(emptyTerritoryRes.status).toBe(400);

    const unknownTerritoryRes = await request(app).get("/api/activities?territory=foo");
    expect(unknownTerritoryRes.status).toBe(404);

    // Aucun mélange : chaque territoire ne voit que sa propre activité.
    const res66 = await request(app).get("/api/activities?territory=66");
    expect(res66.status).toBe(200);
    expect(res66.body.activities).toHaveLength(1);

    const res34 = await request(app).get("/api/activities?territory=34");
    expect(res34.status).toBe(200);
    expect(res34.body.activities).toHaveLength(1);
    expect(res34.body.activities[0].territoryId).toBe(territory34.id);
  });
});

describe("GET /api/territories/mine", () => {
  it("refuse sans authentification", async () => {
    const res = await request(app).get("/api/territories/mine");
    expect(res.status).toBe(401);
  });

  it("renvoie uniquement les territoires de l'utilisateur (le 66 par défaut)", async () => {
    const res = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.territories).toHaveLength(1);
    expect(res.body.territories[0].code).toBe("66");
  });

  it("inclut isDefault=true pour le territoire principal de l'utilisateur", async () => {
    const res = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const territory66 = res.body.territories.find((t: { code: string }) => t.code === "66");
    expect(territory66.isDefault).toBe(true);
  });

  it("inclut isDefault=true pour 34 quand c'est le territoire principal choisi à l'inscription", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    const { token: token34 } = await createUser({
      email: "default34@test.com",
      territoryCode: "34",
    });

    const res = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token34}`);

    expect(res.status).toBe(200);
    const t34 = res.body.territories.find(
      (t: { id: string }) => t.id === territory34.id
    );
    expect(t34.isDefault).toBe(true);
  });

  it("un utilisateur multi-territoires n'a qu'un seul isDefault=true dans la réponse", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    await request(app)
      .post("/api/territories/34/join")
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.territories).toHaveLength(2);
    const defaults = res.body.territories.filter((t: { isDefault: boolean }) => t.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].code).toBe("66");

    const t34 = res.body.territories.find((t: { id: string }) => t.id === territory34.id);
    expect(t34.isDefault).toBe(false);
  });
});

describe("POST /api/territories/:code/join", () => {
  it("refuse sans authentification", async () => {
    const res = await request(app).post("/api/territories/66/join");
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un code de territoire inconnu", async () => {
    const res = await request(app)
      .post("/api/territories/00/join")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("TERRITORY_NOT_FOUND");
  });

  it("rattache l'utilisateur à un nouveau territoire actif, sans toucher son territoire par défaut", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });

    const res = await request(app)
      .post("/api/territories/34/join")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.territory.id).toBe(territory34.id);

    const mineRes = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token}`);
    const codes = mineRes.body.territories.map((t: { code: string }) => t.code);
    expect(codes.sort()).toEqual(["34", "66"]);

    const [membership] = await testDb
      .select({ isDefault: userTerritories.isDefault })
      .from(userTerritories)
      .where(eq(userTerritories.territoryId, territory34.id));
    expect(membership?.isDefault).toBe(false);
  });

  it("refuse (403) de rejoindre un territoire inactif", async () => {
    await createTerritory({ code: "34", isActive: false });

    const res = await request(app)
      .post("/api/territories/34/join")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TERRITORY_NOT_ACTIVE");
  });

  it("est idempotent : rejoindre deux fois le même territoire ne duplique rien", async () => {
    await createTerritory({ code: "34", isActive: true });

    await request(app)
      .post("/api/territories/34/join")
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .post("/api/territories/34/join")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const mineRes = await request(app)
      .get("/api/territories/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(mineRes.body.territories).toHaveLength(2);
  });
});
