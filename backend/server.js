import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import urlRoutes from "./routes/urlRoutes.js";
import zookeeperCoordinator from "./config/zookeeperCoordinator.js";
import { startAnalyticsWorker } from "./utils/analyticsWorker.js";

dotenv.config();

const app = express();

await connectDB();   // important
await zookeeperCoordinator.connect(); // Connect to ZooKeeper and allocate range
startAnalyticsWorker(); // Start background worker for clicks statistics

app.use(express.json());
app.use("/", urlRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});