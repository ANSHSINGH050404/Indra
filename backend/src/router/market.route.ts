import { Router } from "express";
import { getAllMarkets } from "../controller/market.controller";

const router = Router();

router.get("/markets", getAllMarkets);

export default router;
