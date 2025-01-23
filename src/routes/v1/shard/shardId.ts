import { Router } from "express";
import {
  deleteShardById,
  fetchShardById,
  saveShard,
  updateShard,
  getComments,
  likeShard,
  dislikeShard
} from "../../../controllers/http/shard";

const shardIdRouter = Router();
shardIdRouter.get("/", fetchShardById);
shardIdRouter.put("/", saveShard); // TODO
shardIdRouter.patch("/", updateShard);
shardIdRouter.delete("/", deleteShardById);
shardIdRouter.get("/comments", getComments);
shardIdRouter.post("/comments", );
shardIdRouter.post("/likes", likeShard);
shardIdRouter.delete("/likes", dislikeShard);

export default shardIdRouter;
