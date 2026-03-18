"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
require("dotenv/config");
const neon_http_1 = require("drizzle-orm/neon-http");
const schema_1 = require("../db/schema");
const serverless_1 = require("@neondatabase/serverless");
const db = (0, neon_http_1.drizzle)({ client: (0, serverless_1.neon)(process.env.DATABASE_URL) });
const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await db.select().from(schema_1.usersTable).where(schema_1.usersTable.email.eq(email)).first();
    if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
    }
};
exports.registerUser = registerUser;
