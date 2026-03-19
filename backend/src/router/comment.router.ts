import { Router } from "express";
import { getMarketComments, postComment } from "../controller/comment.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/:marketId", getMarketComments);
router.post("/", authMiddleware, postComment);

export default router;
