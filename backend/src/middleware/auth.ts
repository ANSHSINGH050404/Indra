
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

export const adminMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};
