import { NextFunction, Request, Response } from "express";
import { userDb } from "../../db";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";
import { and, eq } from "drizzle-orm";
import httpRequestTimer from "../../prometheus/histogram";
import { db } from "../../repositories/db";
import { UserWithFollowersAndFollowering } from "../../entities/user";
import { cache } from "../../repositories/cache";

interface UserPostRequestBody {
  id: string;
}

export async function saveUserMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body as UserPostRequestBody;
  let start = Date.now();
  try {
    const user = await db.user.onboard({
      id: body.id,
    });
    if (!user)
      return next(new AppError(500, "could not save user information"));
    res.status(201).json({
      data: {
        user: user,
      },
      error: null,
    });
  } catch (error) {
    logger.debug("saveUserMetadata error: ", error);
    next(new AppError(500, "Could not save user metadata"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function getUserInfo(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let user: UserWithFollowersAndFollowering;
  const id = req.user.id;
  let start = Date.now();
  try {
    const cachedUser = await cache.user.getUserInfo(id);
    if (!cachedUser) {
      const dbUser = await db.user.findByIdWithFollowersList(id);
      if (!dbUser)
        return next(new AppError(400, `user with user id ${id} not found`));
      user = dbUser;
      const out = await cache.user.saveUserInfo(dbUser);
      if (!out) {
        logger.warn("could save user info to cache");
      }
    } else {
      user = cachedUser;
    }
    res.status(200).json({
      data: {
        user,
      },
      error: null,
    });
  } catch (error) {
    logger.debug("userController > getUserInfo() error", error);
    next(new AppError(500, "could not get user info"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function followUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const followerId = req.auth.user.id;
  const followingId = req.user.id;
  let start = Date.now();
  try {
    const out = await db.user.follow(followerId, followingId);
    if (!out)
      return next(
        new AppError(500, `${followerId} could not follow ${followingId}`),
      );
    else {
      const followingUserInfo = await userDb.query.followers.findFirst({
        where: (followers) =>
          and(
            eq(followers.followerId, followerId),
            eq(followers.followingId, followingId),
          ),
      });
      let out = await cache.user.followUser(followerId, followingUserInfo!);
      if (!out) logger.warn("could could follow user in the cache");
    }
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.debug("userController > followUser() error", error);
    next(new AppError(500, "could not follow user"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}

export async function unfollowUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const followerId = req.auth.user.id;
  const followingId = req.user.id;
  let start = Date.now();
  try {
    const out = await db.user.unfollow(followerId, followingId);
    if (!out)
      return next(
        new AppError(500, `${followerId} could not unfollow ${followingId}`),
      );
    res.status(200).json({
      error: null,
      data: {
        response: "OK",
      },
    });
  } catch (error) {
    logger.debug("userController > unFollowUser() error", error);
    next(new AppError(500, "could not unfollow user"));
  } finally {
    const responseTimeInMs = Date.now() - start;
    httpRequestTimer
      .labels(req.method, req.route.path, res.statusCode.toString())
      .observe(responseTimeInMs);
  }
}
