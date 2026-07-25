# Scalable URL Shortener API

A production-grade, highly scalable URL shortener API built with Node.js, Express, and MongoDB. Features a distributed Key Generation Service (KGS) via ZooKeeper for collision-free short link generation, and a Redis-backed write-buffer/ZSET architecture for high-performance click analytics and real-time popularity leaderboards.

---

## Architecture Design

The system is designed with a high-throughput, fault-tolerant structure:
1. Client calls the Express Web Server.
2. For short URL generation, Express requests a unique ID range from ZooKeeper and writes to MongoDB.
3. For redirection, Express checks Redis Cache (Read-Through). If missed, it queries MongoDB and hydrates Redis.
4. Click counters are buffered inside a Redis Hash. A background worker periodically flushes these to MongoDB in batches.

---

## Core Scalability Features

* **Distributed Key Generation Service (KGS):** Uses ZooKeeper range coordination to allocate unique ID intervals (e.g., 10,000 values) to web servers. Web servers convert unique numbers sequentially into Base62 codes. This eliminates duplicate code checking and database index lock collisions.
* **High-Performance Read-Through Caching:** Redirection mappings are cached in Redis with a 1-hour TTL. High-traffic links are resolved entirely in-memory under sub-milliseconds.
* **Redis Write-Back Click Buffer:** Instead of writing click events directly to MongoDB (which creates write locks under heavy loads), increments are buffered asynchronously in a Redis Hash. A background worker flushes buffered counts to MongoDB every 10 seconds in a single bulkWrite operation.
* **Real-time Leaderboard:** Redirection requests increment click scores in a Redis Sorted Set (ZSET), allowing real-time retrieval of the most popular short links. Contains self-healing/cache recovery to rebuild the leaderboard from MongoDB upon cache loss.

---

## Getting Started

### Prerequisites

You must have the following running locally:
* Node.js (v18+)
* MongoDB (on port 27017)
* Redis (on port 6379)
* ZooKeeper (on port 2181)

To run Redis and ZooKeeper locally (e.g. using Homebrew on macOS):
```
brew services start redis
brew services start zookeeper
```

### Installation & Run

1. Clone the repository and navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the `backend` folder:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/url_shortener
   BASE_URL=http://localhost:3000
   REDIS_URL=redis://127.0.0.1:6379
   ZOOKEEPER_URL=127.0.0.1:2181
   ```
4. Start the server in development mode:
   ```
   npm run dev
   ```

---

## API Endpoints

### 1. Shorten URL
* POST `/shorten`
* Request Body:
  ```
  {
    "longUrl": "https://github.com/google/google-api-javascript-client",
    "customAlias": "gjs-client",
    "topic": "Development"
  }
  ```

### 2. Redirect Short URL
* GET `/:code`
* Response: Redirects (302) to the original long URL.

### 3. Get URL Statistics
* GET `/stats/:code`
* Response: Returns real-time metrics for a specific shortened link.

### 4. Get Top 10 Popular URLs
* GET `/stats/popular`
* Response: Returns the top 10 most clicked short URLs sorted by click volume.
