import { Router } from "express";
import { getAllMarkets, getMarketBySlug } from "../controller/market.controller";

const router = Router();

router.get("/markets", getAllMarkets);
router.get("/markets/:slug", getMarketBySlug);

export default router;
