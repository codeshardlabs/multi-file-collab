import { Socket } from "socket.io";
import { errorMessage, errors } from "../../config";
import { User } from "../../entities/user";
import { db } from "../../repositories/db";
import { kvStore } from "../../services/redis/kvStore";

declare module "socket.io" {
  interface Socket {
    user: User;
  }
}

export async function fetchUserFromToken(socket: Socket) {
  const token = socket.handshake.auth.token as string;
  if (!token) {
    throw new Error(errorMessage.get(errors.TOKEN_NOT_FOUND));
  }

  const user = await db.user.findById(token);
  console.log("user", user);

  if (!user) {
    throw new Error(errorMessage.get(errors.USER_NOT_FOUND));
  }
  
  socket.user = user;
}

export function validateRoomId(roomId: string) {
  if (!roomId) {
    throw new Error(errorMessage.get(errors.SHARD_ID_NOT_FOUND));
  }
}
