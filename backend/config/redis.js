import redis from "redis"

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.connect().catch(console.error);

export default client;