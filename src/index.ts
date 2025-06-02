import http from "http";
import { env } from "./config";
import { logger } from "./services/logger/logger";
import { socketService } from "./services/socket";
import { app } from "./app";


async function init() {
  const httpServer = http.createServer(app);
  socketService.io.attach(httpServer);
  const PORT = env.PORT || 8080;
  httpServer.listen(PORT, () => {
    logger.info(`Server is listening on port: ${PORT}`);
  });
  socketService.initListeners();
  setInterval(async () => {
    try {
      const backendUrl = env.BACKEND_URL;
      const res = await fetch(`${backendUrl}/health`);
      console.log("Pinged:", res.status);
    } catch (err) {
      console.error("Ping failed:", err);
    }
  }, 30 * 1000); // every 30 seconds
}

init();

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception Occurred: ", error.message);
});

process.on("unhandledRejection", (error) => {
  logger.warn("Unhandled Rejection Occurred", error); // Asynchronous Error
});
// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown() {
  logger.info("Starting graceful shutdown");
  process.exit(0);
}
