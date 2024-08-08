
import { Server } from "socket.io";

class SocketService {
    private _io: Server;
    constructor() {
        console.log("Init socket server");
        this._io = new Server();
    }
    get io() {
        return this._io;
    }

    public initListeners () {
        const io = this._io;
        io.on("connection", (socket) => {
            console.log("User connected: ", socket.id);

            socket.on("event:message",  ({ activeFile, data }: {activeFile: string, data: string}) => {
                console.log("Active File: ", activeFile);
                console.log("Data: ", data);
                socket.emit("event:server-message", { activeFile, data });
            });

            socket.on("event:visible-files", ({ visibleFiles }: { visibleFiles: string[] }) => {
                console.log("Visible files: ", visibleFiles)
                socket.emit("event:sync-visible-files", { visibleFiles });
            });

            socket.on("disconnect", () => {
                console.log("User disconnected: ", socket.id);
              });
            
        })
    }
} 


export default SocketService;