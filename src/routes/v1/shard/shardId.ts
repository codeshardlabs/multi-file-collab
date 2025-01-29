import { Router } from "express";
import {
  deleteShardById,
  fetchShardById,
  saveShard,
  updateShard,
  getComments,
  likeShard,
  dislikeShard,
  addComment,
} from "../../../controllers/http/shard";
import { populateLimitOffset, queryValidation } from "../../../middleware/http/global";

interface GetCommentsQueryParams {
  limit: number;
  offset: number;
}

const shardIdRouter = Router();
shardIdRouter.get("/", fetchShardById);
shardIdRouter.put("/", saveShard);
shardIdRouter.patch("/", updateShard);
shardIdRouter.delete("/", deleteShardById);
shardIdRouter.get("/comments", queryValidation<GetCommentsQueryParams>, populateLimitOffset, getComments);
shardIdRouter.post("/comments", addComment);
shardIdRouter.post("/likes", likeShard);
shardIdRouter.delete("/likes", dislikeShard);

export default shardIdRouter;
