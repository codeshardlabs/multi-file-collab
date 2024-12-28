import http from "http";
import SocketService from "./services/socket";
import { connectToDB } from "./dbConn";

async function init() {
    connectToDB();
    const httpServer = http.createServer();
    const socketService = new SocketService();
    socketService.io.attach(httpServer);
    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
        console.log(`Server is listening on port: ${PORT}`);
    })
    socketService.initListeners();
}

init();

