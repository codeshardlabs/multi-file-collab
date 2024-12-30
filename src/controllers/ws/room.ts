import { Server, Socket } from "socket.io";
import { KVService } from "../../services/redis/kvStore";
import { IShardRepository } from "../../interfaces/IShardRepository";
import { PubSubService } from "../../services/redis/pubsub";
import { EditorStateManager } from "../../services/redis/editorStateManager";


export async function joinRoom(roomId: string, io: Server, socket: Socket, kvStore: KVService, shardRepo: IShardRepository) {
    if (roomId) {
        console.log("RoomID: ", roomId);
        socket.join(roomId);
        try {
            await kvStore.set(socket.id, roomId);
            const len = await kvStore.llen(roomId);
            if (len == 0) {
                // first user joined the room
                // get the shard by room id 
                const room = await shardRepo.findById(roomId);
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
}


export async function propagateRealtimeCodeUpdates(activeFile:  string, data: string, io: Server, socket: Socket, kvStore: KVService, pubsub: PubSubService, editorManager: EditorStateManager) {
    
    console.log("Active File: ", activeFile);
    console.log("Data: ", data);
    console.log("Socket: ", socket.id);


    try {
        const roomId = await kvStore.get(socket.id);
        if (roomId) {
            io.to(roomId).emit("event:server-message", { activeFile, data });

            await editorManager.cacheLatestUpdates(roomId, activeFile, data);
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

}

export async function propagateVisibleFiles(files: string[], io: Server, socket: Socket, kvStore: KVService, pubsub: PubSubService) {
    console.log("Visible files: ", files)

    try {
        let roomId = await kvStore.get(socket.id);
        if (roomId) {
            io.to(roomId).emit("event:sync-visible-files", { visibleFiles: files });
            await pubsub.publish("EVENT:SYNC-VISIBLE-FILES", JSON.stringify({
                visibleFiles: files
            }));
        }
        else if (!roomId) {
            console.log("RoomId falsy: ", roomId)
        }

    } catch (error) {
        console.log("event:visible-files Error: ", error)
    }
}