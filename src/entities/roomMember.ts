import { roomMembers } from "../db/tables";
export type RoomMember = typeof roomMembers.$inferSelect;