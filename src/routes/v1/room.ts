import { Router } from "express";
import { idValidation } from "../../middleware/http/room";
import { authMiddleware } from "../../middleware/http/auth";
import { fetchLatestRoomFilesState } from "../../controllers/http/room";


const roomRouter = Router();

roomRouter.get("/:id", idValidation, authMiddleware, fetchLatestRoomFilesState);

export default roomRouter;