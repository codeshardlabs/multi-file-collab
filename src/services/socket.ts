import { Server } from "socket.io";
import { pubsub } from "./redis/pubsub";
import { kvStore } from "./redis/kvStore";
import {
  joinRoom,
  propagateRealtimeCodeUpdates,
  propagateVisibleFiles,
} from "../controllers/ws/room";
import { fetchUserFromToken } from "../middleware/ws/room";
import { logger } from "./logger/logger";
import { getSocketRoomKey, getSocketUserKey } from "../controllers/ws/constants";

class SocketService {
  private _io: Server;
  constructor() {
    logger.info("SocketService instance created");
    this._io = new Server({
      cors: {
        origin: "*",
      },
    });
  }
  get io() {
    return this._io;
  }

  public initListeners() {
    logger.info("initListeners() method called");
    const io = this._io;
    io.on("connect", async (socket) => {
      try {
        await fetchUserFromToken(socket);
        console.log("socket.user.id", socket.user.id);
        // this.editorManager.setUserId(socket.user.id);
        logger.info("User connected: ", {
          id: socket.id
        });
        
        socket.on("event:join-room", async ({ roomId }: { roomId: string }) => {
          console.log("event:join-room");
          await joinRoom(roomId, io, socket);
        });

        socket.on("event:message",async ({ activeFile, data, roomId  }: {
            activeFile: string;
            data: string;
            roomId: string;
          }) => {
            console.log("event:message");
            propagateRealtimeCodeUpdates(
              activeFile,
              data,
              roomId,
              io,
              socket,
              // this.editorManager,
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

        socket.on("event:chat-message", async (messageData: { text: string, sender: string, timestamp: string, roomId: string}) => {
          try {
            if (!messageData.roomId) {
              logger.warn("Room ID not found for chat message", {
                userId: socket.user.id
              });
              return;
            }

            // Publish the message to the chat channel
            await pubsub.publish(
              "EVENT:CHAT-MESSAGE",
              JSON.stringify({
                ...messageData,
                userId: socket.user.id,
                roomId: messageData.roomId
              })
            );

            // Emit the message to the room with only the required fields
            io.to(messageData.roomId).emit("event:server-chat-message", {
              text: messageData.text,
              sender: messageData.sender,
              timestamp: messageData.timestamp
            });

            logger.info("Chat message propagated", {
              userId: socket.user.id,
              roomId: messageData.roomId,
              sender: messageData.sender
            });
          } catch (error) {
            logger.error("Error handling chat message", {
              error,
              userId: socket.user.id
            });
            socket.emit("event:error", {
              src: "event:chat-message",
              error
            });
          }
        });

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
          const roomId = await kvStore.get(getSocketUserKey(socket.user.id));

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
          const roomId = await kvStore.get(getSocketUserKey(socket.user.id));
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

        pubsub.subscribe("EVENT:CHAT-MESSAGE", async (err, result) => {
          if (err) {
            logger.warn("Could not subscribe to chat messages", {
              event: "EVENT:CHAT-MESSAGE",
              src: "pubsub"
            });
            return;
          }

          logger.info("Subscribed to chat messages", {
            event: "EVENT:CHAT-MESSAGE",
            src: "pubsub"
          });

          const { text, sender, timestamp, userId, roomId } = JSON.parse(result as string) as {
            text: string;
            sender: string;
            timestamp: string;
            userId: string;
            roomId: string;
          };

          if (roomId) {
            // Emit only the required fields to users
            io.to(roomId).emit("event:chat-message", {
              text,
              sender,
              timestamp
            });
            logger.info("Chat message emitted", {
              userId,
              roomId,
              sender
            });
          } else {
            logger.debug("Room ID not found for chat message", {
              event: "EVENT:CHAT-MESSAGE",
              src: "pubsub"
            });
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
          const socketUserKey = getSocketUserKey(userId);
          let roomId = await kvStore.get(socketUserKey);
          if (roomId) {
            socket.leave(roomId);
            await kvStore.srem(getSocketRoomKey(roomId), userId);
            await kvStore.del(getSocketUserKey(userId))
            // const len = await kvStore.llen(roomId);
            // if (len == 0) {
            //   // all the users left the room -> depopulate the cache
            //   const files = await db.shard.getFiles(Number(roomId));
            //   const keys = [userId, roomId];
            //   if (files) {
            //     for (let file of files) {
            //       const redisKey = `editor:${roomId}:${file.name}:pending`;
            //       keys.push(redisKey);
            //     }
            //   }
            //   await kvStore.del(...keys);
            // }
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
      } catch (error) {
        logger.error("Error in initListeners()", {
          error: error,
        });
      }
    });
  }
}

export const socketService = new SocketService();
