import zookeeper from "node-zookeeper-client";
import logger from "../utils/logger.js";

const PATH = "/kgs-counter";
const RANGE_SIZE = 10000;

class ZooKeeperCoordinator {
  constructor() {
    this.client = zookeeper.createClient(process.env.ZOOKEEPER_URL);
    this.currentCounter = 0;
    this.maxCounter = 0;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("ZooKeeper connection timeout. Please ensure ZooKeeper is installed and running on port 2181. Run 'brew services start zookeeper' to start it."));
      }, 5000); // 5 seconds connection timeout

      this.client.once("connected", () => {
        clearTimeout(timeout);
        logger.success("Connected to ZooKeeper coordinate manager");
        this.isConnected = true;
        this.initializeCounterNode()
          .then(() => this.fetchNextRange())
          .then(resolve)
          .catch(reject);
      });

      this.client.once("error", (err) => {
        clearTimeout(timeout);
        reject(new Error(`ZooKeeper connection error: ${err.message}. Please verify the service is active.`));
      });

      this.client.connect();
    });
  }

  async initializeCounterNode() {
    return new Promise((resolve, reject) => {
      this.client.exists(PATH, (err, stat) => {
        if (err) return reject(err);
        if (stat) {
          resolve();
        } else {
          const data = Buffer.from("0");
          this.client.create(
            PATH,
            data,
            zookeeper.CreateMode.PERSISTENT,
            (createErr, path) => {
              if (createErr) {
                // If the node was created by another concurrent server process, proceed.
                if (
                  createErr.code === zookeeper.Exception.NODE_EXISTS ||
                  (createErr.getName && createErr.getName() === "NODE_EXISTS")
                ) {
                  return resolve();
                }
                return reject(createErr);
              }
              logger.success(`Created node ${path} in ZooKeeper`);
              resolve();
            }
          );
        }
      });
    });
  }

  async fetchNextRange() {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data, stat } = await this.getData(PATH);
        const currentValue = parseInt(data.toString(), 10) || 0;
        const newValue = currentValue + RANGE_SIZE;

        const updatedStat = await this.setData(PATH, Buffer.from(newValue.toString()), stat.version);
        
        this.currentCounter = currentValue;
        this.maxCounter = newValue;
        logger.info(`Allocated new KGS range: [${this.currentCounter}, ${this.maxCounter})`);
        return;
      } catch (err) {
        if (
          err.code === zookeeper.Exception.BADVERSION ||
          (err.getName && err.getName() === "BADVERSION")
        ) {
          logger.warn("ZooKeeper version mismatch, retrying range allocation...");
          continue;
        }
        throw err;
      }
    }
    throw new Error("Failed to fetch range from ZooKeeper after maximum attempts");
  }

  getData(path) {
    return new Promise((resolve, reject) => {
      this.client.getData(path, (err, data, stat) => {
        if (err) return reject(err);
        resolve({ data, stat });
      });
    });
  }

  setData(path, data, version) {
    return new Promise((resolve, reject) => {
      this.client.setData(path, data, version, (err, stat) => {
        if (err) return reject(err);
        resolve(stat);
      });
    });
  }

  async getNextId() {
    if (this.currentCounter >= this.maxCounter) {
      console.log("Local KGS range exhausted. Fetching next range...");
      await this.fetchNextRange();
    }
    const id = this.currentCounter;
    this.currentCounter++;
    return id;
  }
}

const coordinator = new ZooKeeperCoordinator();
export default coordinator;
