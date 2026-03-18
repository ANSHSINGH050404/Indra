import { Router } from "express";
import { loginUser, registerUser, getMe } from "../controller/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
export default router;
