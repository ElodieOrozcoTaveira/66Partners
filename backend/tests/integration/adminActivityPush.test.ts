import { afterAll, afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../../src/app.js";
import { PushService } from "../../src/services/push.services.js";
import { closeTestDb, createSport, createUser, resetAll } from "../helpers/db.js";

function createActivity(token: string, sportId: string) {
  return request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${token}`)
    .send({
      sportId,
      title: "Footing du soir",
      city: "Perpignan",
      startDate: new Date(Date.now() + 86_400_000).toISOString(),
      levelRequired: "BEGINNER",
      maxParticipants: 4,
    });
}

beforeEach(async () => {
  await resetAll();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDb();
});

describe("Alerte push admin à la création d'une activité", () => {
  it("prévient l'admin avec l'organisateur, le sport, le lieu et le lien", async () => {
    const send = jest.spyOn(PushService, "sendToAdmins").mockResolvedValue();
    const sportId = await createSport("Running");
    const user = await createUser({ email: "orga@test.com", pseudo: "Camille" });

    const res = await createActivity(user.token, sportId);

    expect(res.status).toBe(201);
    expect(send).toHaveBeenCalledTimes(1);
    const payload = send.mock.calls[0]![0];
    expect(payload.title).toBe("Nouvelle activité 🏃");
    expect(payload.body).toContain("Camille");
    expect(payload.body).toContain("« Footing du soir »");
    expect(payload.body).toContain("Running à Perpignan");
    expect(payload.url).toBe(`/admin/activites/${res.body.activity.id}`);
  });

  it("ne prévient pas si la création est refusée", async () => {
    const send = jest.spyOn(PushService, "sendToAdmins").mockResolvedValue();
    const sportId = await createSport("Running");
    const user = await createUser({ email: "nv@test.com", emailVerified: false });

    const res = await createActivity(user.token, sportId);

    expect(res.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("ne fait jamais échouer la création si l'alerte échoue", async () => {
    jest.spyOn(PushService, "sendToAdmins").mockImplementation(() => {
      throw new Error("push indisponible");
    });
    const sportId = await createSport("Running");
    const user = await createUser({ email: "orga@test.com" });

    const res = await createActivity(user.token, sportId);

    expect(res.status).toBe(201);
  });
});
