
import { Server } from "socket.io";
import { config } from "dotenv";
import { PubSubService } from "./redis/pubsub";
import { KVService } from "./redis/kvStore";
import { EditorStateManager } from "./redis/editorStateManager";
import { IShardRepository } from "../interfaces/IShardRepository";

config();

const pubsub = new PubSubService();
const kvStore = new KVService();

class SocketService {
    private _io: Server;
    private editorManager: EditorStateManager;
    private shardRepo: IShardRepository;
    constructor(shardRepo: IShardRepository) {
        console.log("Init socket server");
        this._io = new Server({
            cors: {
                origin: process.env.FRONTEND_URL!
            }
        });
        this.shardRepo = shardRepo;
        this.editorManager = new EditorStateManager(shardRepo);
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
                        const len = await kvStore.llen(roomId);
                        if (len == 0) {
                            // first user joined the room
                            // get the shard by room id 
                            const room = await this.shardRepo.findById(roomId);
                            if (room) {
                                const files = room.files; 
                                // populate all the files to redis
                                for (let file of files) {
                                    let redisKey = `editor:${roomId}:${file.name}:pending`;
                                    await kvStore.set(redisKey, file.code);
                                }
                            }
                        }
                        await kvStore.rpush(roomId, socket.id);
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
                    await kvStore.lrem(roomId, 1, socket.id);
                    const len = await kvStore.llen(roomId);
                    if (len == 0) {
                        // all the users left the room -> depopulate the cache
                        const room = await this.shardRepo.findById(roomId);
                        const keys = [socket.id, roomId];
                        if (room) {
                            const files = room.files;
                            for (let file of files) {
                                const redisKey = `editor:${roomId}:${file.name}:pending`;
                                keys.push(redisKey);
                            }
                        }  
                        await kvStore.del(...keys);
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