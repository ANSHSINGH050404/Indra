import { Router } from "express";
import { createMarketAdmin, resolveMarketAdmin, deleteMarketAdmin } from "../controller/admin.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth";

const router = Router();

// Only Admins can access these
router.use(authMiddleware, adminMiddleware);

router.post("/markets", createMarketAdmin);
router.post("/markets/resolve", resolveMarketAdmin);
router.delete("/markets/:id", deleteMarketAdmin);

export default router;
