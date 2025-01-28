import http from "http";
import cors from "cors";
import express, { Request, Response } from "express";
import { env } from "./config";
import { logger } from "./services/logger/logger";
import v1Router from "./routes/v1";
import { socketService } from "./services/socket";
import registry from "./prometheus/registry";
import morgan from "morgan";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
const morganFormat = ":method :url :status :response-time ms";
// API logs
app.use(
  morgan(morganFormat, {
    stream: {
      write(message) {
        const [method, url, status, responseTime] = message.split(" ");
        logger.info(JSON.stringify({ method, url, status, responseTime }));
      },
    },
  }),
);
app.use("/api/v1", v1Router);
app.get("/metrics", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", registry.contentType);
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

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception Occurred: ", error.message);
});

process.on("unhandledRejection", () => {
  logger.warn("Unhandled Rejection Occurred"); // Asynchronous Error
});
// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

async function gracefulShutdown() {
  logger.info("Starting graceful shutdown");
  process.exit(0);
}
