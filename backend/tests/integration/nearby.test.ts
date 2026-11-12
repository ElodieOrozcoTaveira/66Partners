import request from "supertest";
import app from "../../src/app.js";
import { sql } from "drizzle-orm";
import { closeTestDb, createUser, resetAll, testDb } from "../helpers/db.js";

const perpignan = { latitude: 42.6986, longitude: 2.8956 };
// ~10 km de Perpignan : dans le rayon de 50 km.
const canet = { latitude: 42.7053, longitude: 3.0079 };
// ~39 km : dans le rayon de 50 km.
const prades = { latitude: 42.6175, longitude: 2.4220 };
// ~75 km (Carcassonne) : hors du rayon.
const carcassonne = { latitude: 43.2130, longitude: 2.3491 };

function share(token: string, position: { latitude: number; longitude: number }) {
  return request(app).post("/api/nearby").set("Authorization", `Bearer ${token}`).send(position);
}

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Sportifs autour de soi", () => {
  it("exige d'être connecté", async () => {
    const res = await request(app).post("/api/nearby").send(perpignan);
    expect(res.status).toBe(401);
  });

  it("refuse une position invalide", async () => {
    const user = await createUser({ email: "a@test.com" });
    const res = await share(user.token, { latitude: 120, longitude: 2 });
    expect(res.status).toBe(400);
  });

  it("compte les autres membres dans un rayon de 50 km, sans soi-même", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const near = await createUser({ email: "proche@test.com" });
    const far = await createUser({ email: "loin@test.com" });
    await share(near.token, canet);
    await share(far.token, carcassonne);
    const middle = await createUser({ email: "milieu@test.com" });
    await share(middle.token, prades);

    const res = await share(me.token, perpignan);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ count: 2, radiusKm: 50 });
    // Jamais de position ni d'identité renvoyée.
    expect(Object.keys(res.body).sort()).toEqual(["count", "radiusKm", "success"]);
  });

  it("n'enregistre qu'une position arrondie (~1 km)", async () => {
    const user = await createUser({ email: "arrondi@test.com" });
    await share(user.token, perpignan);
    const rows = await testDb.execute(
      sql`select latitude, longitude from user_locations where user_id = ${user.userId}`
    );
    expect(rows.rows[0]).toEqual({ latitude: 42.7, longitude: 2.9 });
  });

  it("ne compte plus un membre qui a retiré sa position ou qui n'est pas revenu depuis 30 jours", async () => {
    const me = await createUser({ email: "moi@test.com" });
    const gone = await createUser({ email: "parti@test.com" });
    const stale = await createUser({ email: "ancien@test.com" });
    await share(gone.token, canet);
    await share(stale.token, canet);
    await testDb.execute(
      sql`update user_locations set updated_at = now() - interval '31 days' where user_id = ${stale.userId}`
    );

    const forget = await request(app).delete("/api/nearby/me").set("Authorization", `Bearer ${gone.token}`);
    expect(forget.status).toBe(204);

    const res = await share(me.token, perpignan);
    expect(res.body.count).toBe(0);
    // La position périmée a été supprimée, pas seulement ignorée.
    const left = await testDb.execute(sql`select user_id from user_locations where user_id = ${stale.userId}`);
    expect(left.rows).toHaveLength(0);
  });
});
