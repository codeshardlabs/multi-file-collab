import { Socket } from "socket.io";
import { errorMessage, errors } from "../../config";
import { User } from "../../entities/user";
import { userRepo } from "../../db";

declare module "socket.io" {
  interface Socket {
    user: User;
  }
}

export async function fetchUserFromToken(
  socket: Socket,
) {
  socket.use(async (_, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) next(new Error(errorMessage.get(errors.TOKEN_NOT_FOUND)));

    const user = await userRepo.findById(token);

    if (!user) next(new Error(errorMessage.get(errors.USER_NOT_FOUND)));
    socket.user = user!;
    next();
  });
}


export async function validateRoomId(roomId: string, socket: Socket) {
  socket.use((_, next) => {
    if (!roomId) next(new Error(errorMessage.get(errors.SHARD_ID_NOT_FOUND)));
    next();
  });
}
