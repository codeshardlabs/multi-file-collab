import { Router } from "express";
import { fetchShards, createShard } from "../../../controllers/http/shard";
import { paramsValidation, setStartTime } from "../../../middleware/http/global";
import shardIdRouter from "./shardId";
import { populateShardId } from "../../../middleware/http/shard";

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
// route
shardRouter.get("/", fetchShards);
shardRouter.post("/", createShard);


export default shardRouter;
