import express from "express";
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { usersTable } from '../db/schema';
import { db } from '../db/index';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export const registerUser = async (req: express.Request, res: express.Response) => {
  console.log("Received body:", req.body);
  const { fullname, email, password } = req.body || {};

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (existingUser) {

    return res.status(400).json({ message: "Email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db.insert(usersTable).values({ fullname, email, password: hashedPassword }).returning({ id: usersTable.id });

  const token = jwt.sign({ email, id: newUser.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });

  return res.status(201).json({ 
    message: "User registered successfully", 
    token, 
    id: newUser.id, 
    fullname 
  });
}


export const loginUser = async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body || {};

  console.log("Received body:", req.body);
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email, id: user.id }, process.env.JWT_SECRET!, { expiresIn: '10h' });

    return res.status(200).json({ message: "Login successful", token ,id: user.id,fullname: user.fullname});

}

export const getMe = async (req: any, res: express.Response) => {
  try {
    const userId = req.user.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userData } = user;
    return res.status(200).json(userData);
  } catch (error) {
    console.error("Error in getMe:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

