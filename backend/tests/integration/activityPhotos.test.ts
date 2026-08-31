import fs from "node:fs";
import crypto from "node:crypto";
import request from "supertest";
import { eq } from "drizzle-orm";
import app from "../../src/app.js";
import { UPLOAD_DIR, resolveUploadPath } from "../../src/middlewares/upload.middleware.js";
import { activities, activityPhotos, participations } from "../../src/db/schema.js";
import {
  resetAll,
  createUser,
  createSport,
  closeTestDb,
  testDb,
} from "../helpers/db.js";

let creatorToken: string;
let participantId: string;
let participantToken: string;
let outsiderToken: string;
let sportId: string;

const futureDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

beforeEach(async () => {
  await resetAll();
  ({ token: creatorToken } = await createUser({ email: "creator@test.com" }));
  ({ userId: participantId, token: participantToken } = await createUser({
    email: "participant@test.com",
  }));
  ({ token: outsiderToken } = await createUser({ email: "outsider@test.com" }));
  sportId = await createSport("Escalade");
});

afterAll(async () => {
  await closeTestDb();
});

function filenameFromUrl(url: string): string {
  const withoutQuery = url.split("?")[0]!;
  return withoutQuery.split("/").pop()!;
}

/** Signe manuellement un token avec le même algorithme que fileAccessToken.ts,
 *  pour construire des cas (expiré, falsifié) qu'on ne peut pas obtenir via signFileUrl. */
function forgeToken(filename: string, expires: number): string {
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET!)
    .update(`${filename}:${expires}`)
    .digest("hex");
  return `${expires}.${signature}`;
}

function fileExistsOnDisk(url: string): boolean {
  return fs.existsSync(`${UPLOAD_DIR}/${filenameFromUrl(url)}`);
}

/** Crée une activité "terminée" (nécessaire pour uploader une photo souvenir) :
 *  passe par la vraie API (donc par la vraie résolution de territoire), puis
 *  recule directement sa date en base — la règle métier "toujours dans le
 *  futur à la création" n'est pas contournée côté API, seule la donnée de
 *  test l'est après coup. */
async function createEndedActivity(): Promise<string> {
  const createRes = await request(app)
    .post("/api/activities")
    .set("Authorization", `Bearer ${creatorToken}`)
    .send({
      title: "Sortie escalade",
      city: "Céret",
      startDate: futureDate(),
      levelRequired: "BEGINNER",
      maxParticipants: 5,
      sportId,
    });

  const activityId = createRes.body.activity.id as string;

  await testDb
    .update(activities)
    .set({ startDate: new Date(Date.now() - 60 * 60 * 1000) })
    .where(eq(activities.id, activityId));

  return activityId;
}

async function acceptParticipant(activityId: string): Promise<void> {
  await testDb.insert(participations).values({
    activityId,
    userId: participantId,
    status: "ACCEPTED",
  });
}

async function uploadPhoto(activityId: string, token: string) {
  const res = await request(app)
    .post(`/api/activities/${activityId}/photos`)
    .set("Authorization", `Bearer ${token}`)
    .attach("file", Buffer.from("fake-image-bytes"), {
      filename: "souvenir.jpg",
      contentType: "image/jpeg",
    });

  return res;
}

describe("Accès aux photos d'activité via /uploads/:filename (F-02)", () => {
  it("refuse l'accès sans token (403)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const rawUrl = uploadRes.body.photo.url.split("?")[0];

    const res = await request(app).get(rawUrl);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse un token invalide (signature falsifiée) (403)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const rawUrl = uploadRes.body.photo.url.split("?")[0] as string;

    const res = await request(app).get(`${rawUrl}?token=9999999999999.deadbeef`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse un token expiré (403)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const rawUrl = uploadRes.body.photo.url.split("?")[0] as string;
    const filename = filenameFromUrl(rawUrl);

    const expiredToken = forgeToken(filename, Date.now() - 1000);
    const res = await request(app).get(`${rawUrl}?token=${expiredToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("autorise l'accès avec un token valide (200)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const signedUrl = uploadRes.body.photo.url as string;

    const res = await request(app).get(signedUrl);

    expect(res.status).toBe(200);
  });

  it("un participant accepté peut accéder à la photo avec un token valide", async () => {
    const activityId = await createEndedActivity();
    await acceptParticipant(activityId);
    const uploadRes = await uploadPhoto(activityId, creatorToken);

    // Le participant récupère lui-même une URL signée via la liste (c'est
    // elle qui doit être utilisée, pas celle du créateur) — on vérifie ici
    // que la liste lui renvoie bien un token qui fonctionne.
    const listRes = await request(app)
      .get(`/api/activities/${activityId}/photos`)
      .set("Authorization", `Bearer ${participantToken}`);

    expect(listRes.status).toBe(200);
    const signedUrl = listRes.body.photos[0].url as string;

    const res = await request(app).get(signedUrl);
    expect(res.status).toBe(200);
    void uploadRes;
  });

  it("refuse un token valide pour la photo A utilisé sur la photo B (403)", async () => {
    const activityId = await createEndedActivity();
    const uploadA = await uploadPhoto(activityId, creatorToken);
    const uploadB = await uploadPhoto(activityId, creatorToken);

    const tokenA = (uploadA.body.photo.url as string).split("?token=")[1];
    const rawUrlB = (uploadB.body.photo.url as string).split("?")[0];

    const res = await request(app).get(`${rawUrlB}?token=${tokenA}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("refuse une tentative de path traversal (400, jamais le fichier système)", async () => {
    const res = await request(app).get(
      `/uploads/${encodeURIComponent("../../../../etc/passwd")}`
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_FILENAME");
  });

  it("le garde-fou anti path-traversal rejette '..' et '.' comme noms de fichier", () => {
    // Un vrai aller-retour HTTP sur /uploads/.. ne peut pas exercer ce cas :
    // Node/Express normalise l'URL en "/" avant même d'atteindre la route
    // (vérifié séparément), donc ce garde-fou de resolveUploadPath() est une
    // protection en profondeur qu'on teste directement.
    expect(resolveUploadPath("..")).toBeNull();
    expect(resolveUploadPath(".")).toBeNull();
    expect(resolveUploadPath("")).toBeNull();
    expect(resolveUploadPath(undefined)).toBeNull();
  });

  it("le garde-fou anti path-traversal rejette tout nom de fichier contenant un séparateur", () => {
    expect(resolveUploadPath("../../etc/passwd")).toBeNull();
    expect(resolveUploadPath("sous-dossier/fichier.jpg")).toBeNull();
    expect(resolveUploadPath("a\\b.jpg")).toBeNull();
  });

  it("le garde-fou anti path-traversal renvoie un chemin strictement dans UPLOAD_DIR pour un nom valide", () => {
    const resolved = resolveUploadPath("photo-valide.jpg");
    expect(resolved).toBe(`${UPLOAD_DIR}/photo-valide.jpg`);
  });

  it("continue de servir un avatar sans authentification ni token (comportement inchangé)", async () => {
    const uploadRes = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("fake-avatar-bytes"), {
        filename: "avatar.png",
        contentType: "image/png",
      });

    const avatarUrl = uploadRes.body.user.avatar as string;
    const res = await request(app).get(avatarUrl);

    expect(res.status).toBe(200);
  });
});

describe("Nettoyage physique des fichiers (F-03 / F-04)", () => {
  it("supprime réellement le fichier lors de la suppression d'une photo", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const url = uploadRes.body.photo.url as string;
    const photoId = uploadRes.body.photo.id as string;

    expect(fileExistsOnDisk(url)).toBe(true);

    const res = await request(app)
      .delete(`/api/activity-photos/${photoId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(fileExistsOnDisk(url)).toBe(false);
  });

  it("supprime l'ancien fichier lors du remplacement de l'avatar", async () => {
    const firstUpload = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("avatar-v1"), {
        filename: "v1.png",
        contentType: "image/png",
      });
    const firstUrl = firstUpload.body.user.avatar as string;
    expect(fileExistsOnDisk(firstUrl)).toBe(true);

    const secondUpload = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("avatar-v2"), {
        filename: "v2.png",
        contentType: "image/png",
      });
    const secondUrl = secondUpload.body.user.avatar as string;

    expect(secondUrl).not.toBe(firstUrl);
    expect(fileExistsOnDisk(firstUrl)).toBe(false);
    expect(fileExistsOnDisk(secondUrl)).toBe(true);
  });

  it("supprime l'ancien fichier lors du remplacement de la couverture", async () => {
    const firstUpload = await request(app)
      .post("/api/users/me/cover-photo")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("cover-v1"), {
        filename: "v1.png",
        contentType: "image/png",
      });
    const firstUrl = firstUpload.body.user.coverPhoto as string;
    expect(fileExistsOnDisk(firstUrl)).toBe(true);

    const secondUpload = await request(app)
      .post("/api/users/me/cover-photo")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("cover-v2"), {
        filename: "v2.png",
        contentType: "image/png",
      });
    const secondUrl = secondUpload.body.user.coverPhoto as string;

    expect(fileExistsOnDisk(firstUrl)).toBe(false);
    expect(fileExistsOnDisk(secondUrl)).toBe(true);
  });

  it("supprime les photos physiques lors de la suppression d'une activité", async () => {
    const activityId = await createEndedActivity();
    const uploadA = await uploadPhoto(activityId, creatorToken);
    const uploadB = await uploadPhoto(activityId, creatorToken);
    const urlA = uploadA.body.photo.url as string;
    const urlB = uploadB.body.photo.url as string;

    expect(fileExistsOnDisk(urlA)).toBe(true);
    expect(fileExistsOnDisk(urlB)).toBe(true);

    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(fileExistsOnDisk(urlA)).toBe(false);
    expect(fileExistsOnDisk(urlB)).toBe(false);
  });

  it("supprime avatar, couverture et photos concernées lors de la suppression du compte", async () => {
    const avatarUpload = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("avatar"), {
        filename: "avatar.png",
        contentType: "image/png",
      });
    const coverUpload = await request(app)
      .post("/api/users/me/cover-photo")
      .set("Authorization", `Bearer ${creatorToken}`)
      .attach("file", Buffer.from("cover"), {
        filename: "cover.png",
        contentType: "image/png",
      });

    const activityId = await createEndedActivity();
    const photoUpload = await uploadPhoto(activityId, creatorToken);

    const avatarUrl = avatarUpload.body.user.avatar as string;
    const coverUrl = coverUpload.body.user.coverPhoto as string;
    const photoUrl = photoUpload.body.photo.url as string;

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(fileExistsOnDisk(avatarUrl)).toBe(false);
    expect(fileExistsOnDisk(coverUrl)).toBe(false);
    expect(fileExistsOnDisk(photoUrl)).toBe(false);
  });

  it("reste idempotent si le fichier est déjà absent du disque (aucune erreur)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const url = uploadRes.body.photo.url as string;
    const photoId = uploadRes.body.photo.id as string;

    // Le fichier disparaît "à la main" (ex. déjà nettoyé par un job externe)
    // avant que l'app n'essaie elle-même de le supprimer.
    fs.unlinkSync(`${UPLOAD_DIR}/${filenameFromUrl(url)}`);
    expect(fileExistsOnDisk(url)).toBe(false);

    const res = await request(app)
      .delete(`/api/activity-photos/${photoId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("ne supprime pas le fichier d'une photo encore référencée ailleurs (garde-fou anti-suppression prématurée)", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const url = uploadRes.body.photo.url.split("?")[0] as string;

    // Un deuxième enregistrement pointe volontairement vers le même fichier
    // (cas limite) : le supprimer ne doit PAS effacer le fichier tant que
    // cette autre référence existe.
    await testDb.insert(activityPhotos).values({
      activityId,
      uploaderId: participantId,
      url,
    });

    const photoId = uploadRes.body.photo.id as string;
    await request(app)
      .delete(`/api/activity-photos/${photoId}`)
      .set("Authorization", `Bearer ${creatorToken}`);

    expect(fs.existsSync(`${UPLOAD_DIR}/${filenameFromUrl(url)}`)).toBe(true);
  });
});

describe("Endpoints photos existants — non-régression", () => {
  it("GET /api/activities/:id/photos refuse un non-participant (403)", async () => {
    const activityId = await createEndedActivity();

    const res = await request(app)
      .get(`/api/activities/${activityId}/photos`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("POST /api/activities/:id/photos refuse avant la fin de l'activité", async () => {
    const createRes = await request(app)
      .post("/api/activities")
      .set("Authorization", `Bearer ${creatorToken}`)
      .send({
        title: "Sortie future",
        city: "Céret",
        startDate: futureDate(),
        levelRequired: "BEGINNER",
        maxParticipants: 5,
        sportId,
      });
    const activityId = createRes.body.activity.id as string;

    const res = await uploadPhoto(activityId, creatorToken);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ACTIVITY_NOT_ENDED");
  });

  it("DELETE /api/activity-photos/:photoId refuse un autre utilisateur que l'auteur", async () => {
    const activityId = await createEndedActivity();
    const uploadRes = await uploadPhoto(activityId, creatorToken);
    const photoId = uploadRes.body.photo.id as string;

    const res = await request(app)
      .delete(`/api/activity-photos/${photoId}`)
      .set("Authorization", `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });
});
