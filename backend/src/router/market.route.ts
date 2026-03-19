import { Router } from "express";
import { getAllMarkets, getMarketBySlug, getMarketCategories, userMarket, getMarketPriceHistory } from "../controller/market.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/markets", getAllMarkets);
router.get("/markets/categories", getMarketCategories);
router.get("/markets/:slug", getMarketBySlug);
router.get("/markets/:slug/history", getMarketPriceHistory);
router.get("/user/markets", authMiddleware, userMarket);

export default router;
