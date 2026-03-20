
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";

interface CustomRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export const adminMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error in adminMiddleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

