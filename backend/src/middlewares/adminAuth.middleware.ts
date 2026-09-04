import type { Request, Response, NextFunction } from "express";
import { verifyAdminToken } from "../utils/adminJwt.js";

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentification admin requise",
      code: "ADMIN_UNAUTHENTICATED",
    });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    verifyAdminToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Session admin invalide ou expirée",
      code: "ADMIN_INVALID_TOKEN",
    });
  }
}
