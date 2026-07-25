import express from "express";
import {
  createShortUrl,
  redirectUrl,
  getStats,
  getPopularStats,
} from "../controller/urlcontroller.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.get("/stats/popular", getPopularStats);
router.get("/stats/:code", getStats);
router.get("/:code", redirectUrl);

export default router;