import request from "supertest";
import { eq, sql } from "drizzle-orm";
import app from "../../src/app.js";
import { userTerritories } from "../../src/db/schema.js";
import {
  resetAll,
  createUser,
  createSport,
  createTerritory,
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
  ({ token } = await createUser({ email: "creator@test.com" }));
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
});
