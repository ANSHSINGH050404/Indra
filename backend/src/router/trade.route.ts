import { Router } from "express";
import { createTrade, getALLTradesByUser } from "../controller/trade.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/trades", authMiddleware, createTrade);
router.get("/trades", authMiddleware, getALLTradesByUser);

export default router;
