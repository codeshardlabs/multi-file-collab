import http from "http";
import SocketService from "./services/socket";
import { connectToDB } from "./dbConn";
import { Shard } from "./models/shard";
import ShardRepository from "./repositories/ShardRepository";
import express from "express";
import { fetchLatestRoomFilesState } from "./controllers/http/room";
import { KVService } from "./services/redis/kvStore";
import { idValidation } from "./middleware/http/room";

const newShardRepo = new ShardRepository(Shard);
const kvService = new KVService()
const socketService = new SocketService(newShardRepo, kvService);
const app = express();

app.get("/api/v1/room/:id/files", idValidation, (req, res) => {
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

