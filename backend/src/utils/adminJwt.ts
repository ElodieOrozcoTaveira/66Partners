import jwt from "jsonwebtoken";

export interface AdminJwtPayload {
  role: "admin";
}

export function signAdminToken(): string {
  return jwt.sign({ role: "admin" }, process.env.ADMIN_JWT_SECRET!, {
    expiresIn: "12h",
  });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as AdminJwtPayload;

  if (payload.role !== "admin") {
    throw new Error("Token admin invalide");
  }

  return payload;
}
