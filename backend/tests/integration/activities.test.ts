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

let token: string;
let otherToken: string;
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
  ({ token: otherToken } = await createUser({ email: "other@test.com" }));
  sportId = await createSport("Running");
});

afterAll(async () => {
  await closeTestDb();
});

describe("POST /api/activities", () => {
  it("crée une activité (authentifié)", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    expect(res.status).toBe(201);
    expect(res.body.activity.title).toBe("Sortie running");
    expect(res.body.activity.sportId).toBe(sportId);
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .post("/api/activities")
      .send(validActivity());
    expect(res.status).toBe(401);
  });

  it("refuse un sportId inexistant", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ sportId: randomUUID() }));

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SPORT_NOT_FOUND");
  });

  it("refuse une date dans le passé", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ startDate: "2020-01-01T00:00:00.000Z" }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse un titre manquant", async () => {
    const { title, ...body } = validActivity();
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse maxParticipants ≤ 1", async () => {
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ maxParticipants: 1 }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/activities", () => {
  it("renvoie une liste vide", async () => {
    const res = await request(app).get("/api/activities?territory=66");
    expect(res.status).toBe(200);
    expect(res.body.activities).toEqual([]);
  });

  it("renvoie les activités créées", async () => {
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    const res = await request(app).get("/api/activities?territory=66");
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
  });

  it("filtre par ville", async () => {
    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ city: "Perpignan" }));

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ city: "Canet" }));

    const res = await request(app).get(
      "/api/activities?territory=66&city=Perpignan"
    );
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].city).toBe("Perpignan");
  });

  it("filtre par sportId", async () => {
    const otherSportId = await createSport("Natation");

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());

    await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity({ sportId: otherSportId }));

    const res = await request(app).get(
      `/api/activities?territory=66&sportId=${sportId}`
    );
    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
  });

  it("refuse sans territoire (400)", async () => {
    const res = await request(app).get("/api/activities");
    expect(res.status).toBe(400);
  });

  it("refuse un territoire inexistant (404)", async () => {
    const res = await request(app).get("/api/activities?territory=ZZ");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/activities — filtres de date (from/to)", () => {
  /** Crée une activité future via l'API (règle métier respectée à la
   *  création) puis recule sa date directement en base — même pattern que
   *  activityPhotos.test.ts::createEndedActivity. */
  async function createActivityAt(date: Date, overrides: Record<string, unknown> = {}): Promise<string> {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity(overrides));
    const activityId = createRes.body.activity.id as string;

    await testDb.update(activities).set({ startDate: date }).where(eq(activities.id, activityId));

    return activityId;
  }

  it("1. ne retourne que les activités futures quand from=maintenant", async () => {
    await createActivityAt(new Date(Date.now() + 60 * 60 * 1000), { title: "Future" });
    await createActivityAt(new Date(Date.now() - 60 * 60 * 1000), { title: "Passée" });

    const res = await request(app).get(
      `/api/activities?territory=66&from=${encodeURIComponent(new Date().toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities).toHaveLength(1);
    expect(res.body.activities[0].title).toBe("Future");
  });

  it("2. exclut les activités passées des listes publiques (sans territoire autre filtre que la date)", async () => {
    await createActivityAt(new Date(Date.now() - 24 * 60 * 60 * 1000), { title: "Hier" });

    const res = await request(app).get(
      `/api/activities?territory=66&from=${encodeURIComponent(new Date().toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities).toEqual([]);
  });

  it("3. activité du jour même (plus tard aujourd'hui) incluse dans la plage from=maintenant/to=fin de journée", async () => {
    const now = new Date();
    const laterToday = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    await createActivityAt(laterToday, { title: "Plus tard aujourd'hui" });

    const res = await request(app).get(
      `/api/activities?territory=66&from=${encodeURIComponent(now.toISOString())}&to=${encodeURIComponent(endOfDay.toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities.map((a: { title: string }) => a.title)).toContain("Plus tard aujourd'hui");
  });

  it("4. filtre from seul", async () => {
    const t1 = await createActivityAt(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), { title: "J+2" });
    await createActivityAt(new Date(Date.now() + 1000), { title: "Dans 1s" });

    const res = await request(app).get(
      `/api/activities?territory=66&from=${encodeURIComponent(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities.map((a: { id: string }) => a.id)).toEqual([t1]);
  });

  it("5. filtre to seul", async () => {
    const t1 = await createActivityAt(new Date(Date.now() + 1000), { title: "Bientôt" });
    await createActivityAt(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), { title: "Dans 3 jours" });

    const res = await request(app).get(
      `/api/activities?territory=66&to=${encodeURIComponent(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities.map((a: { id: string }) => a.id)).toEqual([t1]);
  });

  it("6. combinaison from + to : seules les activités dans l'intervalle sont retournées", async () => {
    await createActivityAt(new Date(Date.now() + 1000), { title: "Trop tôt" });
    const inRange = await createActivityAt(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), { title: "Dans la plage" });
    await createActivityAt(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), { title: "Trop tard" });

    const res = await request(app).get(
      `/api/activities?territory=66` +
        `&from=${encodeURIComponent(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}` +
        `&to=${encodeURIComponent(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString())}`
    );

    expect(res.status).toBe(200);
    expect(res.body.activities.map((a: { id: string }) => a.id)).toEqual([inRange]);
  });

  it("7/8/9. le filtre date se cumule avec le territoire (66 et 34 isolés)", async () => {
    const territory34 = await createTerritory({ code: "34", isActive: true });
    const { userId: creator34Id, token: creator34Token } = await createUser({
      email: "dateterritory34@test.com",
    });
    await attachUserToTerritory(creator34Id, territory34.id);

    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const createRes34 = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creator34Token}`)
      .send(validActivity({ territoryId: territory34.id, title: "Activité 34" }));
    const activity34Id = createRes34.body.activity.id as string;
    await testDb.update(activities).set({ startDate: future }).where(eq(activities.id, activity34Id));

    const activity66Id = await createActivityAt(future, { title: "Activité 66" });

    const fromParam = encodeURIComponent(new Date().toISOString());

    const res66 = await request(app).get(`/api/activities?territory=66&from=${fromParam}`);
    expect(res66.status).toBe(200);
    expect(res66.body.activities.map((a: { id: string }) => a.id)).toEqual([activity66Id]);

    const res34 = await request(app).get(`/api/activities?territory=34&from=${fromParam}`);
    expect(res34.status).toBe(200);
    expect(res34.body.activities.map((a: { id: string }) => a.id)).toEqual([activity34Id]);
  });

  it("11. rejette un paramètre de date invalide (400), jamais une erreur SQL", async () => {
    const res = await request(app).get("/api/activities?territory=66&from=not-a-date");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("12. rejette to < from (400)", async () => {
    const from = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const to = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    const res = await request(app).get(
      `/api/activities?territory=66&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_DATE_RANGE");
  });
});

describe("GET /api/activities/:id", () => {
  it("renvoie une activité par son ID", async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    const activityId = createRes.body.activity.id as string;

    const res = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.activity.id).toBe(activityId);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .get(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("renvoie 400 pour un UUID invalide", async () => {
    const res = await request(app)
      .get("/api/activities/not-a-uuid")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("refuse sans authentification", async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    const activityId = createRes.body.activity.id as string;

    const res = await request(app).get(`/api/activities/${activityId}`);
    expect(res.status).toBe(401);
  });

  it("renvoie 404 (jamais 403) pour un utilisateur qui n'est pas membre du territoire de l'activité", async () => {
    // Le créateur est rattaché au territoire "34" en plus du 66 par défaut,
    // et y crée explicitement son activité. L'outsider ne rejoint jamais
    // "34" — il ne reste membre que du 66, comme tout compte fraîchement créé.
    const { userId: creatorId, token: creator34Token } = await createUser({
      email: "creator34@test.com",
    });
    const territory34 = await createTerritory({ code: "34" });
    await attachUserToTerritory(creatorId, territory34.id);

    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creator34Token}`)
      .send(validActivity({ territoryId: territory34.id }));
    const activityId = createRes.body.activity.id as string;
    expect(createRes.body.activity.territoryId).toBe(territory34.id);

    const { token: outsiderToken } = await createUser({ email: "outsider34@test.com" });

    const outsiderRes = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${outsiderToken}`);
    expect(outsiderRes.status).toBe(404);
    expect(outsiderRes.body.code).toBe("ACTIVITY_NOT_FOUND");

    const ownerRes = await request(app)
      .get(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${creator34Token}`);
    expect(ownerRes.status).toBe(200);
  });
});

describe("PATCH /api/activities/:id", () => {
  let activityId: string;

  beforeEach(async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    activityId = createRes.body.activity.id as string;
  });

  it("le créateur peut modifier son activité", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Running modifié" });

    expect(res.status).toBe(200);
    expect(res.body.activity.title).toBe("Running modifié");
  });

  it("refuse la modification par un autre utilisateur", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Tentative de hack" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app)
      .patch(`/api/activities/${activityId}`)
      .send({ title: "X" });
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .patch(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "X" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });
});

describe("DELETE /api/activities/:id", () => {
  let activityId: string;

  beforeEach(async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${token}`)
      .send(validActivity());
    activityId = createRes.body.activity.id as string;
  });

  it("le créateur peut supprimer son activité", async () => {
    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refuse la suppression par un autre utilisateur", async () => {
    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse sans authentification", async () => {
    const res = await request(app).delete(`/api/activities/${activityId}`);
    expect(res.status).toBe(401);
  });

  it("renvoie 404 pour un ID inexistant", async () => {
    const res = await request(app)
      .delete(`/api/activities/${randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("ACTIVITY_NOT_FOUND");
  });
});
