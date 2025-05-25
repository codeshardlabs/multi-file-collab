



export function getSocketUserKey(userId: string) {
  return `socket:user:${userId}`;
}

export function getSocketRoomKey(roomId: string) {
  return `socket:room:${roomId}:users`;
}