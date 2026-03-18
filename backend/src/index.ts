import express from "express";
import { db } from "./db/index";
import dotenv from "dotenv";
import authRouter from "./router/auth.route";
import morgan from "morgan";
dotenv.config();
import cors from "cors";
import marketRouter from "./router/market.route";
import tradeRouter from "./router/trade.route";

const app = express();
app.use(cors());
app.use(morgan("dev"));
const PORT = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello TypeScript Backend 🚀");
});

app.use("/auth", authRouter);
app.use("/api", marketRouter);
app.use("/api", tradeRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
