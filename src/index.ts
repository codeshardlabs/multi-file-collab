import http from "http";
import cors from "cors";
import express, { Request, Response } from "express";
import { env } from "./config";
import { logger } from "./services/logger/logger";
import v1Router from "./routes/v1";
import { socketService } from "./services/socket";
import registry from "./prometheus/registry";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);

app.use(express.json());
app.use("/api/v1", v1Router);
app.get('/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});



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
