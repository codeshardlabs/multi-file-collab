import { Server, Socket } from "socket.io";
// import { pubsub } from "./redis/pubsub";
import { kvStore } from "./redis/kvStore";
import {
  joinRoom,
  propagateRealtimeCodeUpdates,
  propagateVisibleFiles,
} from "../controllers/ws/room";
import { fetchUserFromToken } from "../middleware/ws/room";
import { logger } from "./logger/logger";
import { getSocketRoomKey, getSocketUserKey } from "../controllers/ws/constants";
import { env } from "../config";
import { clerkInst } from "./clerk";
import { db } from "../repositories/db";

class SocketService {
  private _io: Server;
  private readonly MAX_LISTENERS = 10; // Set a reasonable limit for event listeners

  constructor() {
    logger.info("SocketService instance created");
    this._io = new Server({
      cors: {
        origin: env.FRONTEND_URL,
      },
      maxHttpBufferSize: 1e8, // 100MB
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
    });
    
    // Set max listeners for the server
    this._io.setMaxListeners(this.MAX_LISTENERS);
  }

  get io() {
    return this._io;
  }

  private cleanupSocketListeners(socket: Socket) {
    // Remove all listeners for specific events
    socket.removeAllListeners("event:join-room");
    socket.removeAllListeners("event:message");
    socket.removeAllListeners("event:visible-files");
    socket.removeAllListeners("event:chat-message");
    socket.removeAllListeners("error");
  }

  public initListeners() {
    logger.info("initListeners() method called");
    const io = this._io;
    
    io.on("connect", async (socket) => {
      try {
        await fetchUserFromToken(socket);
        logger.info("User connected: ", {
          id: socket.id
        });
        
        // Set max listeners for this socket
        socket.setMaxListeners(this.MAX_LISTENERS);
        
        const joinRoomHandler = async ({ roomId }: { roomId: string }) => {
          logger.info("event:join-room");
          await joinRoom(roomId, io, socket);
        };

        const messageHandler = async ({ activeFile, data, roomId }: {
          activeFile: string;
          data: string;
          roomId: string;
        }) => {
          logger.info("event:message");
          await propagateRealtimeCodeUpdates(
            activeFile,
            data,
            roomId,
            io,
            socket,
          );
        };

        const visibleFilesHandler = async ({
          visibleFiles,
          roomId,
        }: {
          visibleFiles: string[];
          roomId: string;
        }) => {
          logger.info("event:visible-files");
          await propagateVisibleFiles(visibleFiles, roomId, io, socket);
        };

        const chatMessageHandler = async (messageData: { 
          text: string, 
          sender: string, 
          timestamp: string, 
          roomId: string
        }) => {
          try {
            if (!messageData.roomId) {
              logger.warn("Room ID not found for chat message", {
                userId: socket.user.id
              });
              return;
            }

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
        };

        const errorHandler = (error: any) => {
          socket.emit("error", {
            data: null,
            error: {
              message: error.message,
            },
          });

          logger.debug("error event", {
            message: error.message,
          });
        };

        const propagateRoomStateHandler = async ({roomId, fileName, code}: {roomId: string, fileName: string, code: string}) => {
          logger.info("event:propagate-room-state", {
            roomId,
            fileName,
            code
          });
          await db.shard.updateFiles(Number(roomId), {
            name: fileName,
            code: code
          });
        };

        // Attach event listeners
        socket.on("event:join-room", joinRoomHandler);
        socket.on("event:message", messageHandler);
        socket.on("event:visible-files", visibleFilesHandler);
        socket.on("event:chat-message", chatMessageHandler);
        socket.on("event:propagate-room-state", propagateRoomStateHandler);
        socket.on("error", errorHandler);

        socket.on("disconnect", async () => {
          try {
            const userId = String(socket.user.id);
            const socketUserKey = getSocketUserKey(userId);
            let roomId = await kvStore.get(socketUserKey);
            
            if (roomId) {
              const user = await clerkInst.getClerkUser(userId);
              await kvStore.srem(getSocketRoomKey(roomId), userId);
              await kvStore.del(getSocketUserKey(userId));
             io.to(roomId).emit("event:server-chat-message", {
              text: `${user.username} left the room`,
              sender: "System",
              timestamp: new Date().toISOString(),
             });
             socket.leave(roomId);
              logger.info("User left the room", {
                userId: userId,
                event: "disconnect",
                src: "socket.io",
              });
            } else {
              logger.warn("Room Id not found", {
                event: "disconnect",
                src: "socket.io",
              });
            }
          } catch (error) {
            logger.error("Error during disconnect", {
              error,
              userId: socket.user?.id
            });
          } finally {
            // Clean up all listeners
            this.cleanupSocketListeners(socket);
          }
        });
      } catch (error) {
        logger.error("Error in initListeners()", {
          error: error,
        });
        // Clean up listeners even if there's an error
        this.cleanupSocketListeners(socket);
      }
    });
  }
}

export const socketService = new SocketService();
