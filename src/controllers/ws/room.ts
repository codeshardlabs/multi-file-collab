import { Server, Socket } from "socket.io";
import { KVService } from "../../services/redis/kvStore";
import { IShardRepository } from "../../interfaces/IShardRepository";
import { PubSubService } from "../../services/redis/pubsub";
import { EditorStateManager } from "../../services/redis/editorStateManager";
import { validateRoomId } from "../../middleware/ws/room";
import { errorMessage, errors } from "../../config";

export function joinRoom(roomId: string, io: Server, socket: Socket, kvStore: KVService, shardRepo: IShardRepository) {
    // validate room id: library not required
    console.log("join room handler");
    validateRoomId(roomId, socket);
    const userId = socket.user.id;
    socket.join(roomId);
        try {
            const pipeline = kvStore.multi();
            pipeline
                .set(userId, roomId)
                .rpush(roomId, userId)
                 .llen(roomId, async (err, results) => {
                     if (err) throw err;
                    const len = results!;
                    if (len == 1) {
                        // first user joined the room
                        // get the shard by room id 
                        const room = await shardRepo.findById(roomId);
                        if (room) {
                            const files = room.files;
                            // populate all the files to redis
                            let pipeline = kvStore.multi();
                            for (let file of files) {
                                let redisKey = `editor:${roomId}:${file.name}:pending`;
                                const timestamp = Date.now();
                                pipeline.hset(redisKey, {
                                    code: file.code, 
                                    lastModified: timestamp,
                                });
                                pipeline.zadd(`project:${roomId}:changes`, timestamp, file.name);
                            }
                            await pipeline.exec();
                        }
                        else {
                            throw new Error(errorMessage.get(errors.ROOM_ID_NOT_FOUND));
                        }
                    }
                })
                 .exec((err, _) => {
                     if (err) throw err;
                });
            
            
        } catch (error) {
            console.log("Could not join room: ", error);
            io.to(roomId).emit("event:error", {
                src: "event:join-room",
                error: error
            })
        }
}


export async function propagateRealtimeCodeUpdates(activeFile:  string, data: string, roomId: string, io: Server, socket: Socket, pubsub: PubSubService, editorManager: EditorStateManager) {
    console.log("Active File: ", activeFile);
    console.log("Data: ", data);
    console.log("Socket: ", socket.id);


    try {
            io.to(roomId).emit("event:server-message", { activeFile, data });
            await Promise.all([
                editorManager.cacheLatestUpdates(roomId, activeFile, data),
                pubsub.publish("EVENT:MESSAGE", JSON.stringify({
                    activeFile,
                    data
                }))
            ]);

    } catch (error) {
        console.log("event:message Error: ", error)
        io.to(roomId).emit("event:error", {
            src : "event:message",
            error: error
        })
    }

}

export async function propagateVisibleFiles(files: string[], roomId: string, io:Server, socket: Socket, pubsub: PubSubService) {
    console.log("Visible files: ", files)

    try {
            io.to(roomId).emit("event:sync-visible-files", { visibleFiles: files });
            await pubsub.publish("EVENT:SYNC-VISIBLE-FILES", JSON.stringify({
                visibleFiles: files
            }));
    } catch (error) {
        console.log("event:visible-files Error: ", error)
        io.to(roomId).emit("event:error", {
            src: "event:visible-files",
            error: error
        });
    }
}