
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader);
  const token= authHeader && authHeader.split(' ')[1];
  console.log("Extracted token:", token);
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("Decoded token:", decoded);
    req.user = decoded;
    next();
    
  } catch (error) {
    console.error("Error occurred while verifying token:", error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export const adminMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};
