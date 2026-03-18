import { Router } from "express";
import { getLeaderboard } from "../controller/leaderboard.controller";

const router = Router();

router.get("/leaderboard", getLeaderboard);

export default router;

