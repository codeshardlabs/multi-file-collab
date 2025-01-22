import { Router } from "express";
import {
  deleteShardById,
  fetchShardById,
  saveShard,
  updateShard,
} from "../../../controllers/http/shard";

const shardIdRouter = Router();
shardIdRouter.get("/", fetchShardById);
shardIdRouter.put("/", saveShard); // TODO
shardIdRouter.patch("/", updateShard);
shardIdRouter.delete("/", deleteShardById);

export default shardIdRouter;
