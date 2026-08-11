import express from "express";
import {
  register,
  login,
  googleLogin,
  logout,
  getMe,
} from "../controller/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Auth Rate Limiter configured via environment variables
const authLimiter = rateLimiter({
  capacity: parseInt(process.env.RATE_LIMIT_AUTH_CAPACITY, 10),
  refillRate: parseFloat(process.env.RATE_LIMIT_AUTH_REFILL_RATE),
  limiterName: "Auth"
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleLogin);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;
