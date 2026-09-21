import { jest } from "@jest/globals";

// uploadedFiles.ts est mocké AVANT tout import (même transitif) de
// src/app.js, pour simuler un échec de nettoyage physique de fichier —
// même pattern que le mock de mail.services.ts dans admin.auth.test.ts. Le
// compte doit malgré tout être supprimé en base (best-effort, non bloquant,
// cf. AccountDeletionService).
const mockDeleteUploadedFileIfUnreferenced = jest
  .fn<(url: string | null | undefined) => Promise<void>>()
  .mockRejectedValue(new Error("Disque plein (simulé)"));

jest.unstable_mockModule("../../src/utils/uploadedFiles.js", () => ({
  deleteUploadedFileIfUnreferenced: mockDeleteUploadedFileIfUnreferenced,
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../../src/app.js");
const { eq } = await import("drizzle-orm");
const { resetAll, createUser, closeTestDb, testDb } = await import("../helpers/db.js");
const { users } = await import("../../src/db/schema.js");

beforeEach(async () => {
  await resetAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe("AccountDeletionService — résilience aux erreurs de nettoyage de fichiers", () => {
  it("supprime le compte même si le nettoyage physique d'un fichier échoue", async () => {
    const { userId, token } = await createUser({ email: "fileerror@test.com" });

    const res = await request(app).delete("/api/users/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [row] = await testDb.select().from(users).where(eq(users.id, userId));
    expect(row).toBeUndefined();
  });
});
