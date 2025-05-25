import express, { NextFunction, Request, Response } from "express";
import shardRouter from "./shard/shard";
import roomRouter from "./room";
import userRouter from "./user";
import { authMiddleware } from "../../middleware/http/auth";
import commentRouter from "./comment";
import swaggerUi from "swagger-ui-express";
import * as swaggerDoc from "./openapi.json"; // mark resolveJsonModule as true in the tsconfig.json
import { Router } from "express";
import assignmentRoutes from "./assignments";

const v1Router = express.Router();

//routes
v1Router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
v1Router.use("/shards", authMiddleware, shardRouter);
v1Router.use("/rooms", authMiddleware, roomRouter);
v1Router.use("/users", userRouter);
v1Router.use("/comments", authMiddleware, commentRouter);
v1Router.use("/assignments", assignmentRoutes);

export default v1Router;
