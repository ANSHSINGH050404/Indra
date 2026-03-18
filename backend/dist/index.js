"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const serverless_1 = require("@neondatabase/serverless");
const neon_http_1 = require("drizzle-orm/neon-http");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_route_1 = __importDefault(require("./router/auth.route"));
dotenv_1.default.config();
const sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
const db = (0, neon_http_1.drizzle)({ client: sql });
const app = (0, express_1.default)();
const PORT = 3000;
app.get("/", (req, res) => {
    res.send("Hello TypeScript Backend 🚀");
});
app.use("/auth", auth_route_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
