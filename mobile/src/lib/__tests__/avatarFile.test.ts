import { AVATAR_MAX_BYTES, toAvatarFile } from "../avatarFile";

describe("toAvatarFile", () => {
  it("prépare un JPEG", () => {
    expect(toAvatarFile({ uri: "file:///a.jpg", mimeType: "image/jpeg", fileSize: 200_000 })).toEqual({
      uri: "file:///a.jpg",
      name: "avatar.jpg",
      type: "image/jpeg",
    });
  });

  it("suppose du JPEG sans type connu", () => {
    expect(toAvatarFile({ uri: "file:///a" })).toMatchObject({ type: "image/jpeg", name: "avatar.jpg" });
  });

  it("refuse les formats que le serveur rejette (HEIC)", () => {
    expect(toAvatarFile({ uri: "file:///a.heic", mimeType: "image/heic" })).toHaveProperty("error");
  });

  it("refuse une photo de plus de 5 Mo", () => {
    expect(toAvatarFile({ uri: "file:///a.png", mimeType: "image/png", fileSize: AVATAR_MAX_BYTES + 1 })).toHaveProperty(
      "error"
    );
  });
});
