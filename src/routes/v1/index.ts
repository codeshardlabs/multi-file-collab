import express, { NextFunction, Request, Response } from "express";
import shardRouter from "./shard/shard";
import roomRouter from "./room";
import userRouter from "./user";
import { authMiddleware } from "../../middleware/http/auth";
import { errorHandler } from "../../middleware/http/global";
import commentRouter from "./comment";

const v1Router = express.Router();

// Middleware to introduce random slowdowns and errors
const randomizeResponse = (req: Request, res: Response, next: NextFunction) => {
  const randomDelay = Math.random() * 1000; // Random delay up to 1 second
  const randomError = Math.random() < 0.1; // 10% chance of error

  setTimeout(() => {
    if (randomError) {
      res.status(500).send("Random error occurred");
    } else {
      next();
    }
  }, randomDelay);
};

//global middleware
v1Router.use(errorHandler);

//routes
v1Router.use("/shards", authMiddleware, randomizeResponse, shardRouter);
v1Router.use("/rooms", authMiddleware, randomizeResponse, roomRouter);
v1Router.use("/users", randomizeResponse, userRouter);
v1Router.use("/comments", authMiddleware, randomizeResponse, commentRouter);

export default v1Router;
