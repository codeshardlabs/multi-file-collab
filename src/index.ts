import http from "http";
import cors from "cors";
import express from "express";
import { env } from "./config";
import { logger } from "./services/logger/logger";
import v1Router from "./routes/v1";
import { socketService } from "./services/socket";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);

app.use(express.json());
app.use("/api/v1", v1Router);

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

// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown() {
  logger.info("Starting graceful shutdown");
  process.exit(0);
}
