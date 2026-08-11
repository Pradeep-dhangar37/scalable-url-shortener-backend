import redisClient from "../config/redis.js";
import logger from "../utils/logger.js";

// Lua script to implement Token Bucket algorithm atomically in Redis
const LUA_TOKEN_BUCKET = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2]) -- tokens per millisecond
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4] or 1)

local data = redis.call('HMGET', key, 'tokens', 'lastRefilled')
local tokens = tonumber(data[1])
local lastRefilled = tonumber(data[2])

if not tokens then
  tokens = capacity
  lastRefilled = now
else
  local elapsed = now - lastRefilled
  if elapsed > 0 then
    local refilled = elapsed * refill_rate
    tokens = math.min(capacity, tokens + refilled)
    lastRefilled = now
  end
end

if tokens >= requested then
  tokens = tokens - requested
  redis.call('HMSET', key, 'tokens', tokens, 'lastRefilled', lastRefilled)
  -- Key expires after 1 hour of inactivity
  redis.call('EXPIRE', key, 3600)
  return {1, math.floor(tokens)}
else
  return {0, math.floor(tokens)}
end
`;

/**
 * Token Bucket Rate Limiter Middleware Factory
 * @param {Object} options Configuration options
 * @param {number} options.capacity Max tokens the bucket can hold
 * @param {number} options.refillRate Refill rate in tokens per second
 * @param {string} options.limiterName Diagnostic logger name prefix
 */
export const rateLimiter = ({ capacity = 20, refillRate = 0.5, limiterName = "API" } = {}) => {
  // Convert refillRate from tokens/second to tokens/millisecond
  const refillRatePerMs = refillRate / 1000;

  return async (req, res, next) => {
    try {
      // Safely fetch IP address. Trust proxy values if behind Cloudflare/ALB
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
      
      // Separate bucket keys by request IP
      const key = `rate_limit:${limiterName.toLowerCase()}:${ip}`;
      const now = Date.now();

      // Run Redis Lua script atomically
      const result = await redisClient.eval(LUA_TOKEN_BUCKET, {
        keys: [key],
        arguments: [
          capacity.toString(),
          refillRatePerMs.toString(),
          now.toString(),
          "1"
        ]
      });

      const [allowed, remainingTokens] = result;

      // Expose rate limit headers
      res.setHeader("X-RateLimit-Limit", capacity);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, remainingTokens));

      if (allowed === 1) {
        next();
      } else {
        logger.warn(`[${limiterName} RATE LIMIT] Exceeded for IP: ${ip}`);
        res.status(429).json({
          error: "Too Many Requests",
          message: "You are making requests too quickly. Please slow down.",
        });
      }
    } catch (err) {
      logger.error(`[${limiterName} RATE LIMIT ERROR]: ${err.message}`);
      // Fail-open strategy to prevent Redis downtime from causing complete outage
      next();
    }
  };
};
