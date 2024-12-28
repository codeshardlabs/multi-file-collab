import http from "http";
import SocketService from "./services/socket";
import { connectToDB } from "./dbConn";
import ShardRepository from "./repositories/ShardRepository";
import { Shard } from "./models/shard";

const newShardRepo = ShardRepository.getInstance(Shard);

async function init() {
    connectToDB();
    const httpServer = http.createServer();
    const socketService = new SocketService(newShardRepo);
    socketService.io.attach(httpServer);
    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
        console.log(`Server is listening on port: ${PORT}`);
    })
    socketService.initListeners();
}

init();

