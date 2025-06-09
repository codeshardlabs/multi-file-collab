import { Router } from "express";
import {
  createNewRoom,
  fetchAllRooms
} from "../../../controllers/http/room";
import { paramsValidation, populateLimitOffset, queryValidation } from "../../../middleware/http/global";
import { populateShardId } from "../../../middleware/http/shard";
import { validateNewRoomRequestBody } from "../../../middleware/http/room";
import { ShardTemplateType } from "../../../interfaces/repositories/db/shard";
import roomIdRouter from "./roomId";

const roomRouter = Router();

interface RoomIdParams {
  id: number;
}

roomRouter.use(
  "/:id",
  paramsValidation<RoomIdParams>,
  populateShardId,
  roomIdRouter
);

interface FetchRoomsQueryParams{
  limit:number;
  offset: number;
}

export interface NewRoomRequestBody {
  templateType: ShardTemplateType;
}

roomRouter.get("/", queryValidation<FetchRoomsQueryParams>, populateLimitOffset, fetchAllRooms);
roomRouter.post("/",validateNewRoomRequestBody , createNewRoom);

export default roomRouter;
