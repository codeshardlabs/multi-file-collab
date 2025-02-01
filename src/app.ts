import express, { Request, Response } from "express";
import { env } from "./config";
import cors from "cors";
import morgan from "morgan";
import { logger } from "./services/logger/logger";
import v1Router from "./routes/v1";
import registry from "./prometheus/registry";

export const app = express();

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
