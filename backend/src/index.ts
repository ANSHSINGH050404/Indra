import express from "express";
import { db } from "./db/index";
import dotenv from "dotenv";
import authRouter from "./router/auth.route";
import morgan from "morgan";
dotenv.config();
import cors from "cors";
import marketRouter from "./router/market.route";
import tradeRouter from "./router/trade.route";
import adminRouter from "./router/admin.route";
import leaderboardRouter from "./router/leaderboard.route";

const app = express();
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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsAllowList.has(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(morgan("dev"));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello TypeScript Backend 🚀");
});

app.use("/auth", authRouter);
app.use("/api", marketRouter);
app.use("/api", tradeRouter);
app.use("/api/admin", adminRouter);
app.use("/api", leaderboardRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
