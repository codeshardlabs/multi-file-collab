import { Router } from "express";
import {  deleteShardById, fetchShardById, fetchShards, saveShard, updateShard } from "../../controllers/http/shard";
import { idValidation } from "../../middleware/http/room";


const shardRouter = Router();

shardRouter.get("/", fetchShards);
shardRouter.get("/:id", idValidation, fetchShardById);
shardRouter.post("/:id", idValidation, saveShard);
shardRouter.patch("/:id", idValidation, updateShard);
shardRouter.delete("/:id", idValidation, deleteShardById);

export default shardRouter;