import Url from "../models/Url.js";
import redisClient from "../config/redis.js";
import zookeeperCoordinator from "../config/zookeeperCoordinator.js";
import { encode } from "../utils/base62.js";
import logger from "../utils/logger.js";

// CREATE SHORT URL
export const createShortUrl = async (req, res) => {
  try {
    logger.info("Incoming Request to shorten URL:", req.body.longUrl);

    const { longUrl, customAlias, topic } = req.body;

    if (!longUrl) {
      logger.warn("URL shortening failed: longUrl field is missing");
      return res.status(400).json({ error: "URL required" });
    }

    let shortCode;
    if (customAlias) {
      // Check if alias already exists
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        logger.warn(`URL shortening failed: customAlias '${customAlias}' already in use`);
        return res.status(400).json({ error: "Custom alias already in use" });
      }
      shortCode = customAlias;
    } else {
      // Allocate collision-free unique shortCode from KGS (ZooKeeper Range)
      const nextId = await zookeeperCoordinator.getNextId();
      shortCode = encode(nextId);
    }

    logger.info(`Generated shortCode: ${shortCode}`);

    const newUrl = new Url({
      shortCode,
      longUrl,
      topic: topic || "General",
      userId: req.user ? req.user.userId : undefined,
    });

    await newUrl.save();
    logger.success(`Shortened URL saved to DB: ${shortCode} -> ${longUrl}`);

    res.json({
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      topic: newUrl.topic,
    });
  } catch (err) {
    logger.error("Error in createShortUrl:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// REDIRECT
export const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    logger.info(`Redirect request received for code: ${code}`);

    // 1. Check Redis Cache
    const cachedUrl = await redisClient.get(code);
    if (cachedUrl) {
      logger.success(`Cache HIT for code: ${code} -> ${cachedUrl}`);

      // Increment click buffer in Redis (Non-blocking write-back)
      redisClient.hIncrBy("url_clicks", code, 1).catch((err) =>
        logger.error(`Redis Click Buffering Error for code ${code}:`, err.message)
      );

      // Track popularity in Redis Sorted Set (ZSET)
      redisClient.zIncrBy("popular_urls", 1, code).catch((err) =>
        logger.error(`Redis ZSET Popularity Increment Error for code ${code}:`, err.message)
      );

      return res.redirect(cachedUrl);
    }

    logger.info(`Cache MISS for code: ${code}. Querying Database.`);

    // 2. Check DB (No write load here, pure read)
    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      logger.warn(`Shortcode redirect not found in DB: ${code}`);
      return res.status(404).send("Not found");
    }

    logger.success(`Database HIT for code: ${code} -> ${url.longUrl}`);

    // Increment click buffer in Redis (Non-blocking write-back)
    redisClient.hIncrBy("url_clicks", code, 1).catch((err) =>
      logger.error(`Redis Click Buffering Error for code ${code}:`, err.message)
    );

    // Track popularity in Redis Sorted Set (ZSET)
    redisClient.zIncrBy("popular_urls", 1, code).catch((err) =>
      logger.error(`Redis ZSET Popularity Increment Error for code ${code}:`, err.message)
    );

    // 3. Store in Redis Cache
    await redisClient.setEx(code, 3600, url.longUrl);
    logger.info(`Stored redirection in Redis cache for 1 hour: ${code} -> ${url.longUrl}`);

    res.redirect(url.longUrl);
  } catch (err) {
    logger.error(`Error in redirectUrl for code ${req.params.code}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET STATS
export const getStats = async (req, res) => {
  try {
    const { code } = req.params;
    logger.info(`Fetching stats details for code: ${code}`);

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      logger.warn(`Stats lookup failed. Code not found: ${code}`);
      return res.status(404).json({ error: "URL not found" });
    }

    // Combine DB clicks with any buffered clicks in Redis for 100% real-time accuracy
    const bufferedClicks = await redisClient.hGet("url_clicks", code);
    const totalClicks = url.clicks + (parseInt(bufferedClicks, 10) || 0);

    logger.success(`Stats retrieved for ${code}: clicks = ${totalClicks}`);

    res.json({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      clicks: totalClicks,
      topic: url.topic,
      createdAt: url.createdAt,
    });
  } catch (err) {
    logger.error(`Error in getStats for code ${req.params.code}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET POPULAR STATS (Top 10 URLs)
export const getPopularStats = async (req, res) => {
  try {
    logger.info("Fetching popular links leaderboard list...");

    // Fetch top 10 from Redis ZSET
    let topUrls = await redisClient.zRangeWithScores("popular_urls", 0, 9, { REV: true });

    // Self-healing / Cache recovery:
    // If Redis ZSET is empty but we have data in MongoDB, populate ZSET from MongoDB
    if (!topUrls || topUrls.length === 0) {
      logger.warn("Redis ZSET empty. Rebuilding popular URLs ZSET from MongoDB records...");
      const dbUrls = await Url.find().sort({ clicks: -1 }).limit(10);
      
      if (dbUrls.length > 0) {
        // Rebuild ZSET in Redis
        for (const url of dbUrls) {
          await redisClient.zAdd("popular_urls", { score: url.clicks, value: url.shortCode });
        }
        // Fetch again from ZSET now that it's populated
        topUrls = await redisClient.zRangeWithScores("popular_urls", 0, 9, { REV: true });
      }
    }

    if (!topUrls || topUrls.length === 0) {
      logger.info("No popular links found.");
      return res.json([]);
    }

    const codes = topUrls.map(item => item.value);
    const urls = await Url.find({ shortCode: { $in: codes } });

    // Map and sort matching MongoDB documents to preserve Redis score rankings
    const result = topUrls.map(item => {
      const urlDoc = urls.find(u => u.shortCode === item.value);
      return {
        shortCode: item.value,
        longUrl: urlDoc ? urlDoc.longUrl : null,
        clicks: item.score,
        topic: urlDoc ? urlDoc.topic : "General"
      };
    });

    logger.success(`Retrieved popular links leaderboard with ${result.length} items`);
    res.json(result);
  } catch (err) {
    logger.error("Error in getPopularStats:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET AUTHENTICATED USER'S URLS
export const getUserUrls = async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info(`Fetching created URLs for user ID: ${userId}`);

    const urls = await Url.find({ userId }).sort({ createdAt: -1 });

    const result = await Promise.all(
      urls.map(async (url) => {
        const bufferedClicks = await redisClient.hGet("url_clicks", url.shortCode);
        const totalClicks = url.clicks + (parseInt(bufferedClicks, 10) || 0);

        return {
          shortCode: url.shortCode,
          longUrl: url.longUrl,
          clicks: totalClicks,
          topic: url.topic,
          createdAt: url.createdAt,
        };
      })
    );

    logger.success(`Retrieved ${result.length} URLs for user ID: ${userId}`);
    res.json(result);
  } catch (err) {
    logger.error("Error in getUserUrls:", err.message);
    res.status(500).json({ error: err.message });
  }
};