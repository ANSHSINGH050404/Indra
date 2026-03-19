"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_route_1 = __importDefault(require("./router/auth.route"));
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const market_route_1 = __importDefault(require("./router/market.route"));
const trade_route_1 = __importDefault(require("./router/trade.route"));
const admin_route_1 = __importDefault(require("./router/admin.route"));
const leaderboard_route_1 = __importDefault(require("./router/leaderboard.route"));
const user_route_1 = __importDefault(require("./router/user.route"));
const comment_router_1 = __importDefault(require("./router/comment.router"));
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
});
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").trim().replace(/\/$/, "");
const corsAllowList = new Set([frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"]);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (corsAllowList.has(origin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use((0, morgan_1.default)("dev"));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (req, res) => {
    res.send("Hello TypeScript Backend 🚀");
});
app.get("/health", (req, res) => {
    res.status(200).json({ ok: true });
});
app.use("/auth", auth_route_1.default);
app.use("/api", market_route_1.default);
app.use("/api", trade_route_1.default);
app.use("/api/admin", admin_route_1.default);
app.use("/api", leaderboard_route_1.default);
app.use("/api/user", user_route_1.default);
app.use("/api/comments", comment_router_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
