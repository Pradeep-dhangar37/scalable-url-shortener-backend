import Url from "../models/Url.js";
import redisClient from "../config/redis.js";
import zookeeperCoordinator from "../config/zookeeperCoordinator.js";
import { encode } from "../utils/base62.js";

// CREATE SHORT URL
export const createShortUrl = async (req, res) => {
  try {
    console.log(" Incoming Request Body:", req.body); // DEBUG

    const { longUrl, customAlias, topic } = req.body;

    if (!longUrl) {
      console.log(" longUrl missing");
      return res.status(400).json({ error: "URL required" });
    }

    let shortCode;
    if (customAlias) {
      // Check if alias already exists
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ error: "Custom alias already in use" });
      }
      shortCode = customAlias;
    } else {
      // Allocate collision-free unique shortCode from KGS (ZooKeeper Range)
      const nextId = await zookeeperCoordinator.getNextId();
      shortCode = encode(nextId);
    }

    console.log("Selected shortCode:", shortCode);

    const newUrl = new Url({
      shortCode,
      longUrl,
      topic: topic || "General",
    });

    await newUrl.save();
    console.log(" Saved to DB");

    res.json({
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
      topic: newUrl.topic,
    });
  } catch (err) {
    console.log("ERROR in createShortUrl:", err);
    res.status(500).json({ error: err.message });
  }
};

// REDIRECT
export const redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;
    console.log(" Redirect request for:", code);

    // 1. Check Redis Cache
    const cachedUrl = await redisClient.get(code);
    if (cachedUrl) {
      console.log("Cache HIT:", cachedUrl);

      // Increment click buffer in Redis (Non-blocking write-back)
      redisClient.hIncrBy("url_clicks", code, 1).catch((err) =>
        console.log(" Redis Click Buffering Error:", err)
      );

      // Track popularity in Redis Sorted Set (ZSET)
      redisClient.zIncrBy("popular_urls", 1, code).catch((err) =>
        console.log(" Redis ZSET Popularity Increment Error:", err)
      );

      return res.redirect(cachedUrl);
    }

    console.log("Cache MISS");

    // 2. Check DB (No write load here, pure read)
    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      console.log(" URL not found in DB");
      return res.status(404).send("Not found");
    }

    console.log(" Found in DB:", url.longUrl);

    // Increment click buffer in Redis (Non-blocking write-back)
    redisClient.hIncrBy("url_clicks", code, 1).catch((err) =>
      console.log(" Redis Click Buffering Error:", err)
    );

    // Track popularity in Redis Sorted Set (ZSET)
    redisClient.zIncrBy("popular_urls", 1, code).catch((err) =>
      console.log(" Redis ZSET Popularity Increment Error:", err)
    );

    // 3. Store in Redis Cache
    await redisClient.setEx(code, 3600, url.longUrl);
    console.log("Stored in Redis");

    res.redirect(url.longUrl);
  } catch (err) {
    console.log(" ERROR in redirectUrl:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET STATS
export const getStats = async (req, res) => {
  try {
    const { code } = req.params;
    console.log("Fetching stats for:", code);

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }

    // Combine DB clicks with any buffered clicks in Redis for 100% real-time accuracy
    const bufferedClicks = await redisClient.hGet("url_clicks", code);
    const totalClicks = url.clicks + (parseInt(bufferedClicks, 10) || 0);

    res.json({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      clicks: totalClicks,
      topic: url.topic,
      createdAt: url.createdAt,
    });
  } catch (err) {
    console.log("ERROR in getStats:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET POPULAR STATS (Top 10 URLs)
export const getPopularStats = async (req, res) => {
  try {
    console.log("Fetching popular URLs list...");

    // Fetch top 10 from Redis ZSET
    let topUrls = await redisClient.zRangeWithScores("popular_urls", 0, 9, { REV: true });

    // Self-healing / Cache recovery:
    // If Redis ZSET is empty but we have data in MongoDB, populate ZSET from MongoDB
    if (!topUrls || topUrls.length === 0) {
      console.log("Redis ZSET empty. Rebuilding from MongoDB...");
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

    res.json(result);
  } catch (err) {
    console.log("ERROR in getPopularStats:", err);
    res.status(500).json({ error: err.message });
  }
};