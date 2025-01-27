import { Server } from "socket.io";
import { pubsub } from "./redis/pubsub";
import {  kvStore } from "./redis/kvStore";
import { EditorStateManager } from "./redis/editorStateManager";
import {
  joinRoom,
  propagateRealtimeCodeUpdates,
  propagateVisibleFiles,
} from "../controllers/ws/room";
import { fetchUserFromToken } from "../middleware/ws/room";
import { env } from "../config";
import { logger } from "./logger/logger";
import { shardRepo } from "../db";

class SocketService {
  private _io: Server;
  private editorManager: EditorStateManager;
  constructor() {
    logger.info("SocketService instance created");
    this._io = new Server({
      cors: {
        origin: env.FRONTEND_URL,
      },
    });
    this.editorManager = new EditorStateManager();
  }
  get io() {
    return this._io;
  }

  public initListeners() {
    logger.info("initListeners() method called");
    const io = this._io;
    io.on("connect", async (socket) => {
      fetchUserFromToken(socket);
      this.editorManager.setUserId(socket.user.id);
      logger.info("User connected: ", socket.id);
      socket.on("event:join-room", async ({ roomId }: { roomId: string }) => {
        logger.info("event:join-room");
        joinRoom(roomId, io, socket);
      });

      socket.on(
        "event:message",
        async ({
          activeFile,
          data,
          roomId,
        }: {
          activeFile: string;
          data: string;
          roomId: string;
        }) => {
          logger.info("event:message");
          propagateRealtimeCodeUpdates(
            activeFile,
            data,
            roomId,
            io,
            socket,
            this.editorManager,
          );
        },
      );

      socket.on(
        "event:visible-files",
        async ({
          visibleFiles,
          roomId,
        }: {
          visibleFiles: string[];
          roomId: string;
        }) => {
          logger.info("event:visible-files");
          propagateVisibleFiles(visibleFiles, roomId, io, socket);
        },
      );

      pubsub.subscribe("EVENT:MESSAGE", async (err, result) => {
        if (err) {
          logger.warn("could not subscribe to event", {
            event: "EVENT:MESSAGE",
            src: "pubsub",
          });
          return;
        }

        logger.info("subscribed to event", {
          event: "EVENT:MESSAGE",
          src: "pubsub",
        });

        const { activeFile, data } = JSON.parse(result as string) as {
          activeFile: string;
          data: string;
        };
        const roomId = await kvStore.get(socket.id);

        if (roomId) {
          io.to(roomId).emit("event:message", {
            activeFile,
            data,
          });
          logger.info("emit event: event:message", {
            activeFile,
            data,
          });
        } else {
          logger.debug("room id not found", {
            event: "EVENT:MESSAGE",
            src: "pubsub",
          });
        }
      });

      pubsub.subscribe("EVENT:SYNC-VISIBLE-FILES", async (err, result) => {
        if (err) {
          logger.warn("could not subscribe to event", {
            event: "EVENT:SYNC-VISIBLE-FILES",
            src: "pubsub",
          });
          return;
        }

        logger.info("successfully subscribed to an event", {
          event: "EVENT:SYNC-VISIBLE-FILES",
          src: "pubsub",
        });

        const { visibleFiles } = JSON.parse(result as string) as {
          visibleFiles: string[];
        };
        const roomId = await kvStore.get(socket.id);
        if (roomId) {
          io.to(roomId).emit("event:sync-visible-files", {
            visibleFiles,
          });
          logger.info("emit event", {
            event: "event:sync-visible-files",
            src: "pubsub",
            visibleFiles: visibleFiles,
          });
        } else {
        }
      });

      socket.on("error", (error) => {
        // room id not found
        socket.emit("error", {
          data: null,
          error: {
            message: error.message,
          },
        });

        logger.debug("error event", {
          message: error.message,
        });
      });

      socket.on("disconnect", async () => {
        const userId = String(socket.user.id);
        let roomId = await kvStore.get(userId);
        if (roomId) {
          socket.leave(roomId);
          await kvStore.lrem(roomId, 1, userId);
          const len = await kvStore.llen(roomId);
          if (len == 0) {
            // all the users left the room -> depopulate the cache
            const files = await shardRepo.getFiles(Number(roomId));
            const keys = [userId, roomId];
            if (files) {
              for (let file of files) {
                const redisKey = `editor:${roomId}:${file.name}:pending`;
                keys.push(redisKey);
              }
            }
            await kvStore.del(...keys);
          }
          logger.info("User left the room", {
            userId: userId,
            event: "disconnect",
            src: "socket.io",
          });
        } else if (!roomId) {
          logger.warn("Room Id not found", {
            event: "disconnect",
            src: "socket.io",
          });
        }
      });
    });
  }
}

export const socketService = new SocketService();
