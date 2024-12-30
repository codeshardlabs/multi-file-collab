
import { Server } from "socket.io";
import { config } from "dotenv";
import { PubSubService } from "./redis/pubsub";
import { KVService } from "./redis/kvStore";
import { EditorStateManager } from "./redis/editorStateManager";
import { IShardRepository } from "../interfaces/IShardRepository";
import { joinRoom, propagateRealtimeCodeUpdates, propagateVisibleFiles } from "../controllers/ws/room";

config();

const pubsub = new PubSubService();

class SocketService {
    private _io: Server;
    private editorManager: EditorStateManager;
    private shardRepo: IShardRepository;
    private kvStore: KVService;
    constructor(shardRepo: IShardRepository, kvService: KVService
    ) {
        console.log("Init socket server");
        this._io = new Server({
            cors: {
                origin: process.env.FRONTEND_URL!
            }
        });
        this.shardRepo = shardRepo;
        this.editorManager = new EditorStateManager(shardRepo);
        this.kvStore = kvService;
    }
    get io() {
        return this._io;
    }

    public initListeners() {
        const io = this._io;
        io.on("connect", async (socket) => {
            console.log("User connected: ", socket.id);
            socket.on("event:join-room", async ({ roomId }: { roomId: string; }) => {
                joinRoom(roomId, io, socket, this.kvStore, this.shardRepo);
            } );

            socket.on("event:message", async ({ activeFile, data }: { activeFile: string, data: string }) => {
                propagateRealtimeCodeUpdates(activeFile, data, io, socket, this.kvStore, pubsub, this.editorManager);
            });

            socket.on("event:visible-files", async ({ visibleFiles }: { visibleFiles: string[] }) => {
                propagateVisibleFiles(visibleFiles, io, socket, this.kvStore, pubsub);
            });

            pubsub.subscribe("EVENT:MESSAGE", async (err, result) => {
                if (err) {
                    throw err;
                }

                const { activeFile, data } = JSON.parse(result as string) as { activeFile: string; data: string; };
                const roomId = await this.kvStore.get(socket.id);
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
                const roomId = await this.kvStore.get(socket.id);
                if (roomId) {
                    io.to(roomId).emit("event:message", {
                        visibleFiles
                    })
                }

            })

            socket.on("disconnect", async () => {
                console.log("User disconnected: ", socket.id);
                let roomId = await this.kvStore.get(socket.id);
                if (roomId) {
                    socket.leave(roomId);
                    console.log(roomId);
                    await this.kvStore.lrem(roomId, 1, socket.id);
                    const len = await this.kvStore.llen(roomId);
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
                        await this.kvStore.del(...keys);
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