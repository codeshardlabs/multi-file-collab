import http from "http";
import SocketService from "./services/socket";
import cors from "cors";
import { connectToDB } from "./dbConn";
import { Shard } from "./models/shard";
import ShardRepository from "./repositories/shardRepository";
import express from "express";
import { fetchLatestRoomFilesState } from "./controllers/http/room";
import { KVService } from "./services/redis/kvStore";
import { idValidation } from "./middleware/http/room";
import { authMiddleware } from "./middleware/http/auth";
import UserRepository from "./repositories/userRepository";
import { User } from "./models/user";
import { config } from "dotenv"
const newShardRepo = new ShardRepository(Shard);
const newUserRepo = new UserRepository(User);
const kvService = new KVService()
const socketService = new SocketService(newShardRepo, newUserRepo, kvService);
const app = express();

config();
app.use(cors({
     origin: process.env.FRONTEND_URL!
}))

app.get("/api/v1/room/:id", (req, res, next) => {
    return authMiddleware(req, res, next, newUserRepo);
}, idValidation, (req, res) => {
    return fetchLatestRoomFilesState(res, req.id!, kvService, newShardRepo);
});

async function init() {
    connectToDB();
    const httpServer = http.createServer(app);
    socketService.io.attach(httpServer);
    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
        console.log(`Server is listening on port: ${PORT}`);
    })
    socketService.initListeners();
}

init();

