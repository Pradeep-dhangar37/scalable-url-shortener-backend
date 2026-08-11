import express from "express";
import {
  createShortUrl,
  redirectUrl,
  getStats,
  getPopularStats,
  getUserUrls,
} from "../controller/urlcontroller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// URL Action Limiters configured via environment variables
const shortenLimiter = rateLimiter({
  capacity: parseInt(process.env.RATE_LIMIT_SHORTEN_CAPACITY || "15", 10),
  refillRate: parseFloat(process.env.RATE_LIMIT_SHORTEN_REFILL_RATE || "0.25"),
  limiterName: "Shorten"
});

const statsLimiter = rateLimiter({
  capacity: parseInt(process.env.RATE_LIMIT_STATS_CAPACITY || "30", 10),
  refillRate: parseFloat(process.env.RATE_LIMIT_STATS_REFILL_RATE || "0.5"),
  limiterName: "Stats"
});

const redirectLimiter = rateLimiter({
  capacity: parseInt(process.env.RATE_LIMIT_REDIRECT_CAPACITY || "100", 10),
  refillRate: parseFloat(process.env.RATE_LIMIT_REDIRECT_REFILL_RATE || "2.0"),
  limiterName: "Redirect"
});

router.post("/shorten", requireAuth, shortenLimiter, createShortUrl);
router.get("/urls/my", requireAuth, getUserUrls);
router.get("/stats/popular", statsLimiter, getPopularStats);
router.get("/stats/:code", statsLimiter, getStats);
router.get("/:code", redirectLimiter, redirectUrl);

export default router;