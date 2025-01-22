import { Router } from "express";
import {
  deleteShardById,
  fetchShardById,
  fetchShards,
  createShard,
  saveShard,
  updateShard,
} from "../../controllers/http/shard";
import { idValidation } from "../../middleware/http/room";
import { paramsValidation } from "../../middleware/http/global";

const shardRouter = Router();

interface PatchShardParams {
  id: number;
}

shardRouter.get("/", fetchShards);
shardRouter.get("/:id", idValidation, fetchShardById);
shardRouter.post("/", createShard);
shardRouter.put("/:id", idValidation, saveShard);
shardRouter.patch("/:id", paramsValidation<PatchShardParams>, updateShard);
shardRouter.delete("/:id", idValidation, deleteShardById);

export default shardRouter;
