import { Socket } from "socket.io";
import { errorMessage, errors } from "../../config";



export async function validateRoomId(roomId: string, socket: Socket) {
    socket.use((_, next) => {
        if (!roomId) next(new Error(errorMessage.get(errors.ROOM_ID_NOT_FOUND)));
        next();
    })
}