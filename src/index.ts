import http from "http";
import SocketService from "./services/socket";
import cors from "cors";
import {  shardRepo, userRepo } from "./db";
import express from "express";
import { fetchLatestRoomFilesState } from "./controllers/http/room";
import { KVService } from "./services/redis/kvStore";
import { idValidation } from "./middleware/http/room";
import { authMiddleware } from "./middleware/http/auth";
import { env } from "./config";
import { PubSubService } from "./services/redis/pubsub";
import { logger } from "./services/logger/logger";

const kvService = new KVService()
const pubsub = new PubSubService();
const socketService = new SocketService(shardRepo, userRepo, kvService, pubsub);
const app = express();

app.use(cors({
    origin: env.FRONTEND_URL
}))

app.get("/api/v1/room/:id", (req, res, next) => {
    return authMiddleware(req, res, next, userRepo);
}, idValidation, (req, res) => {
    return fetchLatestRoomFilesState(res, req.id!, kvService, shardRepo);
});

async function init() {
    const httpServer = http.createServer(app);
    socketService.io.attach(httpServer);
    const PORT = env.PORT || 8080;
    httpServer.listen(PORT, () => {
        logger.info(`Server is listening on port: ${PORT}`);
    })
    socketService.initListeners();
}

init();

