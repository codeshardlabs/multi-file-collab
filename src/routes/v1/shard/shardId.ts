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
import { validateSaveShardRequestBody } from "../../../middleware/http/shard";
import { FileInput } from "../../../interfaces/repositories/db/shard";
import { Dependency } from "../../../entities/dependency";

interface GetCommentsQueryParams {
  limit: number;
  offset: number;
}

export interface SaveShardRequestBody {
  files: FileInput[];
  dependencies: Dependency[];
}

const shardIdRouter = Router();
shardIdRouter.get("/", fetchShardById);
shardIdRouter.put("/", validateSaveShardRequestBody, saveShard); 
shardIdRouter.patch("/",  updateShard);
shardIdRouter.delete("/", deleteShardById);
shardIdRouter.get("/comments", queryValidation<GetCommentsQueryParams>, populateLimitOffset, getComments);
shardIdRouter.post("/comments", addComment);
shardIdRouter.post("/likes", likeShard);
shardIdRouter.delete("/likes", dislikeShard);

export default shardIdRouter;
