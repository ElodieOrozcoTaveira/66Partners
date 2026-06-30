import type { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map