import { Router } from "express";
import {
  createNewRoom,
  fetchAllRooms,
  fetchLatestRoomFilesState,
} from "../../controllers/http/room";
import { paramsValidation, populateLimitOffset, queryValidation } from "../../middleware/http/global";
import { populateShardId } from "../../middleware/http/shard";
import { validateNewRoomRequestBody } from "../../middleware/http/room";
import { ShardTemplateType } from "../../interfaces/repositories/db/shard";

const roomRouter = Router();

interface RoomIdParams {
  id: number;
}

roomRouter.get(
  "/:id",
  paramsValidation<RoomIdParams>,
  populateShardId,
  fetchLatestRoomFilesState,
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
