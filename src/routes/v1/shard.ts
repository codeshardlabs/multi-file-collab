import { Router } from "express";
import { fetchShardById, fetchShards, saveShard, saveShardTitle } from "../../controllers/http/shard";
import { idValidation } from "../../middleware/http/room";


const shardRouter = Router();

shardRouter.get("/", fetchShards);
shardRouter.get("/:id", idValidation, fetchShardById);
shardRouter.post("/:id", idValidation, saveShard);
shardRouter.post("/:id/title", idValidation, saveShardTitle);

export default shardRouter;