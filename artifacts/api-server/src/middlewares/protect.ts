import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  userRoles?: string[];
  userActiveRole?: string;
}

export function protect(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.userId = payload.id;
    req.userEmail = payload.email;
    req.userRoles = payload.roles;
    req.userActiveRole = payload.active_role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
