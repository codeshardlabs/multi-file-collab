
import { Server } from "socket.io";
import { config } from "dotenv";
import { PubSubService } from "./redis/pubsub";
import { KVService } from "./redis/kvStore";
import { EditorStateManager } from "./redis/editorStateManager";

config();

const pubsub = new PubSubService();
const kvStore = new KVService();

class SocketService {
    private _io: Server;
    private editorManager: EditorStateManager;
    constructor() {
        console.log("Init socket server");
        this._io = new Server({
            cors: {
                origin: process.env.FRONTEND_URL!
            }
        });

        this.editorManager = new EditorStateManager();
    }
    get io() {
        return this._io;
    }

    public initListeners() {
        const io = this._io;
        io.on("connect", async (socket) => {
            console.log("User connected: ", socket.id);
            socket.on("event:join-room", async ({ roomId }: { roomId: string; }) => {
                if (roomId) {
                    console.log("RoomID: ", roomId);
                    socket.join(roomId);
                    try {

                        await kvStore.set(socket.id, roomId);
                    } catch (error) {
                        console.log("Could not join room: ", error)
                    }
                }
                else if (!roomId) {
                    console.log("RoomId falsy: ", roomId)
                }
            });

            socket.on("event:message", async ({ activeFile, data }: { activeFile: string, data: string }) => {

                console.log("Active File: ", activeFile);
                console.log("Data: ", data);
                console.log("Socket: ", socket.id);


                try {
                    const roomId = await kvStore.get(socket.id);
                    if (roomId) {
                        io.to(roomId).emit("event:server-message", { activeFile, data });

                        await this.editorManager.cacheLatestUpdates(roomId, activeFile, data);
                        await pubsub.publish("EVENT:MESSAGE", JSON.stringify({
                            activeFile,
                            data
                        }));

                    }
                    else if (!roomId) {
                        console.log("RoomId falsy: ", roomId)
                    }

                } catch (error) {
                    console.log("event:message Error: ", error)
                }





            });

            socket.on("event:visible-files", async ({ visibleFiles }: { visibleFiles: string[] }) => {
                console.log("Visible files: ", visibleFiles)

                try {
                    let roomId = await kvStore.get(socket.id);
                    if (roomId) {
                        io.to(roomId).emit("event:sync-visible-files", { visibleFiles });
                        await pubsub.publish("EVENT:SYNC-VISIBLE-FILES", JSON.stringify({
                            visibleFiles
                        }));
                    }
                    else if (!roomId) {
                        console.log("RoomId falsy: ", roomId)
                    }

                } catch (error) {
                    console.log("event:visible-files Error: ", error)
                }
            });

            pubsub.subscribe("EVENT:MESSAGE", async (err, result) => {
                if (err) {
                    throw err;
                }

                const { activeFile, data } = JSON.parse(result as string) as { activeFile: string; data: string; };
                const roomId = await kvStore.get(socket.id);
                if (roomId) {
                    io.to(roomId).emit("event:message", {
                        activeFile,
                        data
                    })
                }

            })

            pubsub.subscribe("EVENT:SYNC-VISIBLE-FILES", async (err, result) => {
                if (err) {
                    throw err;
                }

                const { visibleFiles } = JSON.parse(result as string) as { visibleFiles: string[] }
                const roomId = await kvStore.get(socket.id);
                if (roomId) {
                    io.to(roomId).emit("event:message", {
                        visibleFiles
                    })
                }

            })

            socket.on("disconnect", async () => {
                console.log("User disconnected: ", socket.id);
                let roomId = await kvStore.get(socket.id);
                if (roomId) {
                    socket.leave(roomId);
                    console.log(roomId);
                    const sockets = Array.from(io.sockets.adapter.rooms.get(roomId)!);
                    if (!sockets || sockets.length === 0) {
                        console.log("All users left the room");
                        const exists = await kvStore.exists(socket.id);
                        if (exists == 1) {
                            await kvStore.del(socket.id);
                        }
                    }
                    console.log("User left the room");
                }
                else if (!roomId) {
                    console.log("RoomId falsy: ", roomId)
                }
            })

        })
    }
}


export default SocketService;