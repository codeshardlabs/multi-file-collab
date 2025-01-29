import { Router } from "express";
import { fetchShards, createShard } from "../../../controllers/http/shard";
import {
  paramsValidation,
  queryValidation,
} from "../../../middleware/http/global";
import shardIdRouter from "./shardId";
import {
  populateLimitOffset,
  populateShardId,
} from "../../../middleware/http/shard";

const shardRouter = Router();

interface ShardIdParams {
  id: number;
}
//middleware
shardRouter.use(
  "/:id",
  paramsValidation<ShardIdParams>,
  populateShardId,
  shardIdRouter,
);

interface FetchShardsQueryParams {
  limit: number;
  offset: number;
}
// route
shardRouter.get(
  "/",
  queryValidation<FetchShardsQueryParams>,
  populateLimitOffset,
  fetchShards,
);
shardRouter.post("/", createShard);

export default shardRouter;
