import { AxiosError, AxiosHeaders } from "axios";

import { getApiErrorCode, getApiErrorMessage, resolveMediaUrl } from "../api";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("getApiErrorMessage", () => {
  it("reprend le message métier du backend", () => {
    const error = httpError(409, {
      success: false,
      message: "Vous avez déjà demandé à rejoindre cette activité",
      code: "ALREADY_REQUESTED",
    });
    expect(getApiErrorMessage(error, "fallback")).toBe(
      "Vous avez déjà demandé à rejoindre cette activité"
    );
    expect(getApiErrorCode(error)).toBe("ALREADY_REQUESTED");
  });

  it("n'expose pas de détail technique sur une erreur 500 sans message", () => {
    expect(getApiErrorMessage(httpError(500, {}), "fallback")).toMatch(/Réessaie plus tard/);
  });

  it("signale l'absence de réseau", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getApiErrorMessage(error, "fallback")).toMatch(/connexion internet/);
  });

  it("signale un délai dépassé", () => {
    const error = new AxiosError("timeout", "ECONNABORTED");
    expect(getApiErrorMessage(error, "fallback")).toMatch(/trop de temps/);
  });

  it("utilise le message de repli pour une erreur inconnue", () => {
    expect(getApiErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });
});

describe("resolveMediaUrl", () => {
  it("rattache un chemin d'upload à l'origine de l'API", () => {
    expect(resolveMediaUrl("/uploads/a.webp")).toMatch(/^https:\/\/.+\/uploads\/a\.webp$/);
  });

  it("laisse une URL absolue intacte", () => {
    expect(resolveMediaUrl("https://cdn.example.com/x.png")).toBe("https://cdn.example.com/x.png");
  });

  it("renvoie null sans image", () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("")).toBeNull();
  });
});
