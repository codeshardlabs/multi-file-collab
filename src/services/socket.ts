
import { Server } from "socket.io";
import { config } from "dotenv";
config();

const socketToRoomMap = new Map<string, string>();

class SocketService {
    private _io: Server;
    constructor() {
        console.log("Init socket server");
        this._io = new Server({
            cors: {
                origin: process.env.FRONTEND_URL!
              }
        });
    }
    get io() {
        return this._io;
    }

    public initListeners () {
        const io = this._io;
        io.on("connect", (socket) => {
            console.log("User connected: ", socket.id);

            

            socket.on("event:message", ({ activeFile, data, roomId }: { activeFile: string, data: string, roomId: string }) => {
                socket.join(roomId);
                socketToRoomMap.set(socket.id, roomId);
                console.log("Active File: ", activeFile);
                console.log("Data: ", data);
                io.to(roomId).emit("event:server-message", { activeFile, data });
            });

            socket.on("event:visible-files", ({ visibleFiles }: { visibleFiles: string[] }) => {
                console.log("Visible files: ", visibleFiles)
                let roomId = socketToRoomMap.get(socket.id);
                if (roomId) {
                    io.to(roomId).emit("event:sync-visible-files", { visibleFiles });
                }
            });

            socket.on("disconnect", () => {
                console.log("User disconnected: ", socket.id);
                let roomId = socketToRoomMap.get(socket.id);
                if (roomId) {
                    socket.leave(roomId);
                    const rooms = Array.from(io.sockets.adapter.rooms.get(roomId)!);
                    if (rooms.length === 0) {
                        console.log("All users left the room");
                        socketToRoomMap.delete(roomId!);
                    }
                    console.log("User left the room");
                }
              })
            
        })
    }
} 


export default SocketService;