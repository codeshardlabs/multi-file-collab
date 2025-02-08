import { Router } from "express";
import { fetchShards, createShard } from "../../../controllers/http/shard";
import {
  paramsValidation,
  populateLimitOffset,
  queryValidation,
} from "../../../middleware/http/global";
import shardIdRouter from "./shardId";
import {
  populateShardId,
  validateCreateShardRequestBody,
} from "../../../middleware/http/shard";
import { ShardModeType, ShardTemplateType, ShardTypeType } from "../../../interfaces/repositories/db/shard";

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

export interface ShardPostRequestBody {
  templateType: ShardTemplateType;
  mode: ShardModeType;
  type: ShardTypeType;
}


shardRouter.post("/", validateCreateShardRequestBody, createShard);

export default shardRouter;
