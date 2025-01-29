import { Router } from "express";
import {
  fetchAllRooms,
  fetchLatestRoomFilesState,
} from "../../controllers/http/room";
import { paramsValidation, populateLimitOffset, queryValidation } from "../../middleware/http/global";
import { populateShardId } from "../../middleware/http/shard";

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
roomRouter.get("/", queryValidation<FetchRoomsQueryParams>, populateLimitOffset, fetchAllRooms);

export default roomRouter;
