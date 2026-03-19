import { Router } from "express";
import { claimFaucet, getActivityFeed } from "../controller/user.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/faucet", authMiddleware, claimFaucet);
router.get("/activity", getActivityFeed);

export default router;
