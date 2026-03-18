import { Router } from "express";
import { getAllMarkets, getMarketBySlug, userMarket } from "../controller/market.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/markets", getAllMarkets);
router.get("/markets/:slug", getMarketBySlug);
router.get("/user/markets", authMiddleware, userMarket);

export default router;
