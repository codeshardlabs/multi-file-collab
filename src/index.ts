import http from "http";
import SocketService from "./services/socket";

async function init() {
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

