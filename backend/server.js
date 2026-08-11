import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import urlRoutes from "./routes/urlRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import zookeeperCoordinator from "./config/zookeeperCoordinator.js";
import { startAnalyticsWorker } from "./utils/analyticsWorker.js";
import logger from "./utils/logger.js";

const app = express();

// Enable CORS with Credentials support
app.use((req, res, next) => {
  const origin = req.headers.origin || "http://localhost:3001";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/", urlRoutes);

// Safe server startup wrapper
const startServer = async () => {
  try {
    logger.info("Starting Scalable URL Shortener service...");
    
    await connectDB();
    logger.success("Connected to MongoDB successfully");
    
    await zookeeperCoordinator.connect();
    
    startAnalyticsWorker();
    logger.info("Asynchronous click analytics buffer worker active");

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("FATAL ERROR: Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();