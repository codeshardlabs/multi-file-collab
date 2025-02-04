import { Server, Socket } from "socket.io";
import {  kvStore } from "../../services/redis/kvStore";
import { pubsub } from "../../services/redis/pubsub";
import { EditorStateManager } from "../../services/redis/editorStateManager";
import { validateRoomId } from "../../middleware/ws/room";
import { errorMessage, errors } from "../../config";
import { logger } from "../../services/logger/logger";
import { db } from "../../repositories/db";

export function joinRoom(roomId: string, io: Server, socket: Socket) {
  // validate room id: library not required
  logger.info("joinRoom() called", {
    roomId,
  });
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
          const files = await db.shard.getFiles(Number(roomId));
          if (files) {
            // populate all the files to redis
            let pipeline = kvStore.multi();
            for (let file of files) {
              let redisKey = `editor:${roomId}:${file.name}:pending`;
              const timestamp = Date.now();
              pipeline.hset(redisKey, {
                code: file.code,
                lastModified: timestamp,
              });
              // pipeline.zadd(`project:${roomId}:changes`, "XX", , file.name); // TODO: implement this
            }
            await pipeline.exec();
          } else {
            throw new Error(errorMessage.get(errors.SHARD_ID_NOT_FOUND));
          }
        }
      })
      .exec((err, _) => {
        if (err) throw err;
      });
  } catch (error) {
    logger.error("Could not join room: ", {
      error: error,
      roomId: roomId,
    });
    io.to(roomId).emit("event:error", {
      src: "event:join-room",
      error: error,
    });
  }
}

export async function propagateRealtimeCodeUpdates(
  activeFile: string,
  data: string,
  roomId: string,
  io: Server,
  _: Socket,
  editorManager: EditorStateManager,
) {
  logger.debug("propagateRealtimeCodeUpdates() called", {
    activeFile,
    data,
    roomId,
  });

  try {
    io.to(roomId).emit("event:server-message", { activeFile, data });
    await Promise.all([
      editorManager.cacheLatestUpdates(roomId, activeFile, data),
      pubsub.publish(
        "EVENT:MESSAGE",
        JSON.stringify({
          activeFile,
          data,
        }),
      ),
    ]);
  } catch (error) {
    logger.error("Unexpected Error Occurred", {
      error: error,
      event: "event:message",
      src: "propagateRealtimeCodeUpdates()",
      roomId: roomId,
    });
    io.to(roomId).emit("event:error", {
      event: "event:message",
      error: error,
    });
  }
}

export async function propagateVisibleFiles(
  files: string[],
  roomId: string,
  io: Server,
  socket: Socket,
) {
  logger.debug("propagateVisibleFiles() called", {
    files: files,
    roomId: roomId,
  });

  try {
    io.to(roomId).emit("event:sync-visible-files", { visibleFiles: files });
    await pubsub.publish(
      "EVENT:SYNC-VISIBLE-FILES",
      JSON.stringify({
        visibleFiles: files,
      }),
    );
  } catch (error) {
    logger.error("Unexpected Error Occurred", error);
    io.to(roomId).emit("event:error", {
      src: "event:visible-files",
      error: error,
    });
  }
}
