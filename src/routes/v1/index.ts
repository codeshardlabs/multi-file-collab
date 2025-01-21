import express from "express";
import shardRouter from "./shard";
import roomRouter from "./room";
import userRouter from "./user";

const v1Router = express.Router();

v1Router.use("/shards", shardRouter);
v1Router.use("/rooms", roomRouter);
v1Router.use("/users", userRouter);

export default v1Router;

