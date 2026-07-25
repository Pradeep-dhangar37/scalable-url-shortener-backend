import redisClient from "../config/redis.js";
import Url from "../models/Url.js";

const FLUSH_INTERVAL = 10000; // 10 seconds

export const startAnalyticsWorker = () => {
  console.log("Starting analytics batch write-back worker...");

  setInterval(async () => {
    try {
      const exists = await redisClient.exists("url_clicks");
      if (!exists) {
        return;
      }

      const tempKey = `url_clicks_processing_${Date.now()}`;
      // Atomically rename key so new clicks write to a fresh 'url_clicks'
      await redisClient.rename("url_clicks", tempKey);

      const clicks = await redisClient.hGetAll(tempKey);
      const keys = Object.keys(clicks);

      if (keys.length === 0) {
        await redisClient.del(tempKey);
        return;
      }

      console.log(`Flushing ${keys.length} click stats from Redis to MongoDB...`);

      const operations = Object.entries(clicks).map(([code, count]) => ({
        updateOne: {
          filter: { shortCode: code },
          update: { $inc: { clicks: parseInt(count, 10) } }
        }
      }));

      await Url.bulkWrite(operations);
      await redisClient.del(tempKey);

      console.log("Successfully flushed click stats to DB.");
    } catch (err) {
      console.error("Error in Analytics Worker batch write-back:", err);
    }
  }, FLUSH_INTERVAL);
};
