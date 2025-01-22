import express from "express";
import shardRouter from "./shard/shard";
import roomRouter from "./room";
import userRouter from "./user";
import { authMiddleware } from "../../middleware/http/auth";
import { errorHandler } from "../../middleware/http/global";

const v1Router = express.Router();

//global middleware
v1Router.use(errorHandler);

//routes
v1Router.use("/shards", authMiddleware, shardRouter);
v1Router.use("/rooms", authMiddleware, roomRouter);
v1Router.use("/users", userRouter);

export default v1Router;
