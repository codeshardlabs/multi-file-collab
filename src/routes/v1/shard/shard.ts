import { Router } from "express";
import { fetchShards, createShard } from "../../../controllers/http/shard";
import { paramsValidation } from "../../../middleware/http/global";
import shardIdRouter from "./shardId";
import { populateShardId } from "../../../middleware/http/shard";

const shardRouter = Router();

interface ShardIdParams {
  id: number;
}

shardRouter.get("/", fetchShards);
shardRouter.post("/", createShard);

shardRouter.use(
  "/:id",
  paramsValidation<ShardIdParams>,
  populateShardId,
  shardIdRouter,
);

export default shardRouter;
