import express from "express";
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { usersTable } from '../db/schema';
import { db } from '../db/index';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";


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

  const token = jwt.sign({ email, id: newUser.id, isAdmin: false }, process.env.JWT_SECRET!, { expiresIn: '10h' });

  return res.status(201).json({ 
    message: "User registered successfully", 
    token, 
    id: newUser.id, 
    fullname,
    isAdmin: false
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

    const token = jwt.sign({ email, id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET!, { expiresIn: '10h' });

    return res.status(200).json({ 
        message: "Login successful", 
        token, 
        id: user.id, 
        fullname: user.fullname,
        isAdmin: user.isAdmin
    });

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

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const getGoogleConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:8000/auth/google/callback";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)");
  }

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim(),
    frontendUrl: frontendUrl.trim().replace(/\/$/, ""),
  };
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("Invalid ID token");
  const payloadJson = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(payloadJson);
};

const safeRedirectPath = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
};

export const googleOAuthStart = async (req: express.Request, res: express.Response) => {
  try {
    const { clientId, redirectUri } = getGoogleConfig();
    const jwtSecret = process.env.JWT_SECRET!;
    const redirectPath = safeRedirectPath(req.query.redirect);

    const state = jwt.sign(
      {
        purpose: "google_oauth_state",
        nonce: crypto.randomBytes(16).toString("hex"),
        redirect: redirectPath,
      },
      jwtSecret,
      { expiresIn: "10m" },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  } catch (error: any) {
    console.error("Error starting Google OAuth:", error);
    return res.status(500).json({ message: error.message || "Failed to start Google OAuth" });
  }
};

export const googleOAuthCallback = async (req: express.Request, res: express.Response) => {
  const { error, code, state } = req.query as Record<string, string | undefined>;

  let frontendUrl = "http://localhost:3000";
  try {
    frontendUrl = getGoogleConfig().frontendUrl;
  } catch {
    // If OAuth isn't configured, still return a readable error below.
  }

  const redirectWithError = (message: string) => {
    const hash = new URLSearchParams({ error: message }).toString();
    return res.redirect(`${frontendUrl}/auth/google/callback#${hash}`);
  };

  try {
    if (error) {
      return redirectWithError(error);
    }

    if (!code || !state) {
      return redirectWithError("Missing code/state from Google");
    }

    const jwtSecret = process.env.JWT_SECRET!;
    const decodedState: any = jwt.verify(state, jwtSecret);
    if (!decodedState || decodedState.purpose !== "google_oauth_state") {
      return redirectWithError("Invalid OAuth state");
    }

    const redirectPath = safeRedirectPath(decodedState.redirect);

    const { clientId, clientSecret, redirectUri } = getGoogleConfig();

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson: any = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", tokenJson);
      return redirectWithError("Failed to exchange code for token");
    }

    const idToken = tokenJson.id_token as string | undefined;
    if (!idToken) {
      return redirectWithError("Google did not return an ID token");
    }

    const idPayload = decodeJwtPayload(idToken);

    if (idPayload.aud !== clientId) {
      return redirectWithError("Invalid ID token audience");
    }

    const validIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);
    if (!validIssuers.has(idPayload.iss)) {
      return redirectWithError("Invalid ID token issuer");
    }

    const expMs = Number(idPayload.exp) * 1000;
    if (!expMs || Date.now() > expMs) {
      return redirectWithError("ID token expired");
    }

    const email = (idPayload.email as string | undefined) || "";
    if (!email) {
      return redirectWithError("Google account email not available");
    }

    if (idPayload.email_verified !== true) {
      return redirectWithError("Google email is not verified");
    }

    const fullname =
      (idPayload.name as string | undefined) ||
      (idPayload.given_name as string | undefined) ||
      email.split("@")[0];

    const session = await db.transaction(async (tx) => {
      const [existingUser] = await tx.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

      if (existingUser) {
        if (!existingUser.isVerified) {
          await tx
            .update(usersTable)
            .set({ isVerified: true, updatedAt: new Date() })
            .where(eq(usersTable.id, existingUser.id));
        }

        const token = jwt.sign(
          { email, id: existingUser.id, isAdmin: existingUser.isAdmin },
          jwtSecret,
          { expiresIn: "10h" },
        );

        return { token };
      }

      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const [newUser] = await tx
        .insert(usersTable)
        .values({
          fullname,
          email,
          password: hashedPassword,
          isVerified: true,
        })
        .returning({ id: usersTable.id, isAdmin: usersTable.isAdmin });

      const token = jwt.sign(
        { email, id: newUser.id, isAdmin: newUser.isAdmin },
        jwtSecret,
        { expiresIn: "10h" },
      );

      return { token };
    });

    const hash = new URLSearchParams({ token: session.token, redirect: redirectPath }).toString();
    return res.redirect(`${frontendUrl}/auth/google/callback#${hash}`);
  } catch (error: any) {
    console.error("Error in Google OAuth callback:", error);
    return redirectWithError(error.message || "Google sign-in failed");
  }
};

