import http from "http";
import SocketService from "./services/socket";
import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URL!);
const db = mongoose.connection;
db.on('error', (err) => console.log("database err: ", err));
db.once("open", () => console.log("Database connected successfully"));


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

