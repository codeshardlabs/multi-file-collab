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
