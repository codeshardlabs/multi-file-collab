import express from "express";
import shardRouter from "./shard";
import roomRouter from "./room";
import userRouter from "./user";
import { authMiddleware } from "../../middleware/http/auth";

const v1Router = express.Router();

v1Router.use("/shards", authMiddleware,  shardRouter);
v1Router.use("/rooms", authMiddleware,  roomRouter);
v1Router.use("/users", userRouter);

export default v1Router;

