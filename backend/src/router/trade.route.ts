import { Router } from "express";
import { createTrade, getALLTradesByUser, getPositions } from "../controller/trade.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/trades", authMiddleware, createTrade);
router.get("/trades", authMiddleware, getALLTradesByUser);
router.get("/positions", authMiddleware, getPositions);

export default router;
