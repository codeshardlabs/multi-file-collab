
import { Server } from "socket.io";
import {  PubSubService } from "./redis/pubsub";
import { KVService } from "./redis/kvStore";
import { EditorStateManager } from "./redis/editorStateManager";
import { IShardRepository } from "../interfaces/repositories/IShardRepository";
import { joinRoom, propagateRealtimeCodeUpdates, propagateVisibleFiles } from "../controllers/ws/room";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { fetchUserFromToken } from "../middleware/ws/room";
import { env } from "../config";
import { logger } from "./logger/logger";


class SocketService {
    private _io: Server;
    private editorManager: EditorStateManager;
    private shardRepo: IShardRepository;
    private userRepo: IUserRepository;
    private kvStore: KVService;
    private pubsub: PubSubService;
    constructor(shardRepo: IShardRepository, userRepo: IUserRepository, kvService: KVService
        , pubsub: PubSubService) {
        
        this.pubsub = pubsub;
        logger.info("SocketService instance created");
        this._io = new Server({
            cors: {
                origin: env.FRONTEND_URL
            }
        });
        this.shardRepo = shardRepo;
        this.editorManager = new EditorStateManager(shardRepo);
        this.kvStore = kvService;
        this.userRepo = userRepo;
    }
    get io() {
        return this._io;
    }

    public initListeners() {
        logger.info("initListeners() method called");
        const io = this._io;
        io.on("connect", async (socket) => {
            fetchUserFromToken(socket, this.userRepo);
            logger.info("User connected: ", socket.id);
            socket.on("event:join-room", async ({ roomId }: { roomId: string; }) => {
                logger.info("event:join-room");
                joinRoom(roomId,io, socket, this.kvStore, this.shardRepo);
            });

            socket.on("event:message", async ({ activeFile, data, roomId }: { activeFile: string, data: string; roomId: string; }) => {
                logger.info("event:message");
                propagateRealtimeCodeUpdates(activeFile, data, roomId, io,socket, this.pubsub, this.editorManager);
            });

            socket.on("event:visible-files", async ({ visibleFiles, roomId }: { visibleFiles: string[], roomId: string; }) => {
                logger.info("event:visible-files")
                propagateVisibleFiles(visibleFiles, roomId, io, socket, this.pubsub);
            });

            this.pubsub.subscribe("EVENT:MESSAGE", async (err, result) => {
                if (err) {
                    logger.warn("could not subscribe to event", {
                        metadata: {
                            event: "EVENT:MESSAGE",
                            src: "pubsub"
                        }
                    })
                    return;
                }

                logger.info("subscribed to event", {
                    metadata: {
                        event: "EVENT:MESSAGE",
                        src: "pubsub"
                    }
                })

                const { activeFile, data } = JSON.parse(result as string) as { activeFile: string; data: string; };
                const roomId = await this.kvStore.get(socket.id);

                if (roomId) {
                    io.to(roomId).emit("event:message", {
                        activeFile,
                        data
                    })
                    logger.info("emit event: event:message", {
                        metadata: {
                            activeFile,
                            data
                        }
                    })
                }
                else {
                    logger.debug("room id not found", {
                        metadata: {
                            event: "EVENT:MESSAGE",
                            src: "pubsub"
                        }
                    });
                }

            })

            this.pubsub.subscribe("EVENT:SYNC-VISIBLE-FILES", async (err, result) => {
                if (err) {
                    logger.warn("could not subscribe to event", {
                        metadata: {
                            event: "EVENT:SYNC-VISIBLE-FILES",
                            src: "pubsub"
                        }
                    });
                    return;
                }

                logger.info("successfully subscribed to an event", {
                    metadata: {
                        event: "EVENT:SYNC-VISIBLE-FILES",
                        src: "pubsub"
                    }
                })

                const { visibleFiles } = JSON.parse(result as string) as { visibleFiles: string[] }
                const roomId = await this.kvStore.get(socket.id);
                if (roomId) {
                    io.to(roomId).emit("event:sync-visible-files", {
                        visibleFiles
                    })
                    logger.info("emit event", {
                        metadata: {
                            event: "event:sync-visible-files",
                            src: "pubsub",
                            visibleFiles: visibleFiles
                        }
                    })
                }
                else {

                }

            })

            socket.on("error", (error) => {
                // room id not found
                socket.emit("error", {
                    data: null,
                    error: {
                        message: error.message
                    }
                })

                logger.debug("error event", {
                    metadata: {
                        message: error.message
                    }
                })
            });

            socket.on("disconnect", async () => {
                const userId = socket.user.id;
                let roomId = await this.kvStore.get(userId);
                if (roomId) {
                    socket.leave(roomId);
                    await this.kvStore.lrem(roomId, 1, userId);
                    const len = await this.kvStore.llen(roomId);
                    if (len == 0) {
                        // all the users left the room -> depopulate the cache
                        const room = await this.shardRepo.findById(roomId);
                        const keys = [userId, roomId];
                        if (room) {
                            const files = room.files;
                            for (let file of files) {
                                const redisKey = `editor:${roomId}:${file.name}:pending`;
                                keys.push(redisKey);
                            }
                        }
                        await this.kvStore.del(...keys);
                    }
                    logger.info("User left the room", {
                        metadata: {
                            userId: userId,
                            event: "disconnect",
                            src :"socket.io"
                        }
                    });
                }
                else if (!roomId) {
                    logger.warn("Room Id not found", {
                        metadata: {
                            event: "disconnect",
                            src: "socket.io"
                        }
                    })
                }
            })

        })
    }
}


export default SocketService;