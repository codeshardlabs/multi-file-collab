import { Router } from "express";
import {
  fetchAllRooms,
  fetchLatestRoomFilesState,
} from "../../controllers/http/room";
import { paramsValidation } from "../../middleware/http/global";
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
roomRouter.get("/", fetchAllRooms);

export default roomRouter;
