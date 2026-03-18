import { Router } from "express";
import { createTrade } from "../controller/trade.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/trades", authMiddleware, createTrade);

export default router;
