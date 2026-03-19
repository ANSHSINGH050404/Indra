import { Router } from "express";
import { claimFaucet, getActivityFeed, getUserProfile, updateUserProfile } from "../controller/user.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/faucet", authMiddleware, claimFaucet);
router.get("/activity", getActivityFeed);
router.get("/profile/:id", getUserProfile);
router.patch("/profile", authMiddleware, updateUserProfile);

export default router;
