import { Router } from "express";
import { fetchLatestRoomFilesState, fetchRoomMembers, inviteToRoom } from "../../../controllers/http/room";
import { validateInviteToRoomRequestBody } from "../../../middleware/http/room";

const roomIdRouter = Router();

roomIdRouter.get("/", fetchLatestRoomFilesState);
roomIdRouter.post("/invite", validateInviteToRoomRequestBody, inviteToRoom);
roomIdRouter.get("/members", fetchRoomMembers);

export default roomIdRouter;