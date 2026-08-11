const colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m",      // Cyan
  warn: "\x1b[33m",      // Yellow
  error: "\x1b[31m",     // Red
  success: "\x1b[32m",   // Green
  timestamp: "\x1b[90m"  // Gray
};

const getTimestamp = () => {
  return `${colors.timestamp}[${new Date().toISOString()}]${colors.reset}`;
};

export const logger = {
  info: (...args) => {
    console.log(getTimestamp(), `${colors.info}[INFO]${colors.reset}`, ...args);
  },
  success: (...args) => {
    console.log(getTimestamp(), `${colors.success}[SUCCESS]${colors.reset}`, ...args);
  },
  warn: (...args) => {
    console.warn(getTimestamp(), `${colors.warn}[WARN]${colors.reset}`, ...args);
  },
  error: (...args) => {
    console.error(getTimestamp(), `${colors.error}[ERROR]${colors.reset}`, ...args);
  }
};

export default logger;
