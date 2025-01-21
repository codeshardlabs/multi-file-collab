import { Router } from "express";
import { idValidation } from "../../middleware/http/room";
import { fetchAllRooms, fetchLatestRoomFilesState } from "../../controllers/http/room";


const roomRouter = Router();

roomRouter.get("/:id", idValidation, fetchLatestRoomFilesState);
roomRouter.get("/", fetchAllRooms);

export default roomRouter;