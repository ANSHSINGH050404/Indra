"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthCallback = exports.googleOAuthStart = exports.getMe = exports.loginUser = exports.registerUser = void 0;
require("dotenv/config");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
const index_1 = require("../db/index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body || {};
    if (!fullname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const [existingUser] = await index_1.db.select().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email)).limit(1);
    if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const [newUser] = await index_1.db.insert(schema_1.usersTable).values({ fullname, email, password: hashedPassword }).returning({ id: schema_1.usersTable.id });
    const token = jsonwebtoken_1.default.sign({ email, id: newUser.id, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.status(201).json({
        message: "User registered successfully",
        token,
        id: newUser.id,
        fullname,
        isAdmin: false
    });
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    const [user] = await index_1.db.select().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email)).limit(1);
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = jsonwebtoken_1.default.sign({ email, id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '10h' });
    return res.status(200).json({
        message: "Login successful",
        token,
        id: user.id,
        fullname: user.fullname,
        isAdmin: user.isAdmin
    });
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await index_1.db.select().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId)).limit(1);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userData } = user;
        return res.status(200).json(userData);
    }
    catch (error) {
        console.error("Error in getMe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMe = getMe;
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
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
const safeRedirectPath = (value) => {
    if (typeof value !== "string" || value.length === 0)
        return "/";
    if (!value.startsWith("/"))
        return "/";
    if (value.startsWith("//"))
        return "/";
    return value;
};
const googleOAuthStart = async (req, res) => {
    try {
        const { clientId, redirectUri } = getGoogleConfig();
        const jwtSecret = process.env.JWT_SECRET;
        const redirectPath = safeRedirectPath(req.query.redirect);
        const state = jsonwebtoken_1.default.sign({
            purpose: "google_oauth_state",
            nonce: crypto_1.default.randomBytes(16).toString("hex"),
            redirect: redirectPath,
        }, jwtSecret, { expiresIn: "10m" });
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
            state,
            prompt: "select_account",
        });
        return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
    }
    catch (error) {
        console.error("Error starting Google OAuth:", error);
        return res.status(500).json({ message: error.message || "Failed to start Google OAuth" });
    }
};
exports.googleOAuthStart = googleOAuthStart;
const googleOAuthCallback = async (req, res) => {
    const { error, code, state } = req.query;
    let frontendUrl = "http://localhost:3000";
    try {
        frontendUrl = getGoogleConfig().frontendUrl;
    }
    catch {
        // If OAuth isn't configured, still return a readable error below.
    }
    const redirectWithError = (message) => {
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
        const jwtSecret = process.env.JWT_SECRET;
        const decodedState = jsonwebtoken_1.default.verify(state, jwtSecret);
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
        const tokenJson = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok) {
            console.error("Google token exchange failed:", tokenJson);
            return redirectWithError("Failed to exchange code for token");
        }
        const idToken = tokenJson.id_token;
        if (!idToken) {
            return redirectWithError("Google did not return an ID token");
        }
        // Validate the ID token with Google (includes signature verification).
        const tokenInfoRes = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`);
        const tokenInfo = await tokenInfoRes.json().catch(() => ({}));
        if (!tokenInfoRes.ok) {
            console.error("Google tokeninfo failed:", tokenInfo);
            return redirectWithError("Invalid Google ID token");
        }
        if (tokenInfo.aud !== clientId) {
            return redirectWithError("Invalid ID token audience");
        }
        const validIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);
        if (!validIssuers.has(tokenInfo.iss)) {
            return redirectWithError("Invalid ID token issuer");
        }
        const expMs = Number(tokenInfo.exp) * 1000;
        if (!expMs || Date.now() > expMs) {
            return redirectWithError("ID token expired");
        }
        const email = tokenInfo.email || "";
        if (!email) {
            return redirectWithError("Google account email not available");
        }
        const emailVerified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
        if (!emailVerified) {
            return redirectWithError("Google email is not verified");
        }
        const fullname = tokenInfo.name ||
            tokenInfo.given_name ||
            email.split("@")[0];
        const session = await index_1.db.transaction(async (tx) => {
            const [existingUser] = await tx.select().from(schema_1.usersTable).where((0, drizzle_orm_1.eq)(schema_1.usersTable.email, email)).limit(1);
            if (existingUser) {
                if (!existingUser.isVerified) {
                    await tx
                        .update(schema_1.usersTable)
                        .set({ isVerified: true, updatedAt: new Date() })
                        .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, existingUser.id));
                }
                const token = jsonwebtoken_1.default.sign({ email, id: existingUser.id, isAdmin: existingUser.isAdmin }, jwtSecret, { expiresIn: "10h" });
                return { token };
            }
            const randomPassword = crypto_1.default.randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt_1.default.hash(randomPassword, 10);
            const [newUser] = await tx
                .insert(schema_1.usersTable)
                .values({
                fullname,
                email,
                password: hashedPassword,
                isVerified: true,
            })
                .returning({ id: schema_1.usersTable.id, isAdmin: schema_1.usersTable.isAdmin });
            const token = jsonwebtoken_1.default.sign({ email, id: newUser.id, isAdmin: newUser.isAdmin }, jwtSecret, { expiresIn: "10h" });
            return { token };
        });
        const hash = new URLSearchParams({ token: session.token, redirect: redirectPath }).toString();
        return res.redirect(`${frontendUrl}/auth/google/callback#${hash}`);
    }
    catch (error) {
        console.error("Error in Google OAuth callback:", error);
        return redirectWithError(error.message || "Google sign-in failed");
    }
};
exports.googleOAuthCallback = googleOAuthCallback;
