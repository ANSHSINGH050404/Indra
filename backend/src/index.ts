import express from "express";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
import authRouter from "./router/auth.route";
import morgan from "morgan";
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql });

const app = express();
const PORT = 3000;

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello TypeScript Backend 🚀");
});

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
