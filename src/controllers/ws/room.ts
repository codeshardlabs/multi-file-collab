import { Server, Socket } from "socket.io";
import {  kvStore } from "../../services/redis/kvStore";
import { pubsub } from "../../services/redis/pubsub";
import { validateRoomId } from "../../middleware/ws/room";
import { logger } from "../../services/logger/logger";
import { getSocketRoomKey, getSocketUserKey } from "./constants";

export async function joinRoom(roomId: string, io: Server, socket: Socket) {
  // validate room id: library not required
  logger.info("joinRoom() called", {
    roomId,
  });
  const userId = socket.user.id;
  validateRoomId(roomId);
  const socketUserKey = getSocketUserKey(userId);
  const roomIdFromSocket = await kvStore.get(socketUserKey);
  if(roomIdFromSocket && String(roomIdFromSocket) === String(roomId)) {
    logger.warn("user already in room", {
      userId,
      roomId,
    });
    return;
  }
  socket.join(roomId);
  try {
    await kvStore.set(socketUserKey, roomId);
    const roomUserKey = getSocketRoomKey(roomId);
    // Use SADD which is atomic and will only add if not already present
    await kvStore.sadd(roomUserKey, userId);
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
  // editorManager: EditorStateManager,
) {
  logger.debug("propagateRealtimeCodeUpdates() called", {
    activeFile,
    data,
    roomId,
  });

  try {
    io.to(roomId).emit("event:server-message", { activeFile, data });
    await Promise.all([
      // editorManager.cacheLatestUpdates(roomId, activeFile, data),
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
