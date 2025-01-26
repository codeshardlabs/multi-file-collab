import { NextFunction, Request, Response } from "express";
import { userDb, userRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";
import { redisRepo } from "../../repositories/cache/redis";
import { User } from "../../entities/user";
import { UserWithFollowersAndFollowering } from "../../interfaces/repositories/db/user";
import { and, eq } from "drizzle-orm";

 interface UserPostRequestBody {
  id: string;
}

export async function saveUserMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const body = req.body as UserPostRequestBody;
  try {
    const user = await userRepo.onboard({
      id: body.id,
    });
    if (!user) next(new AppError(500, "could not save user information"));
    res.status(201).json({
      data: {
        user: user,
      },
      error: null
    });
    return;
  } catch (error) {
    logger.debug("saveUserMetadata error: ", error);
    next(new AppError(500, "Could not save user metadata"));
  }
}

export async function getUserInfo(req: Request, res: Response, next: NextFunction) {
  let user: UserWithFollowersAndFollowering;
  try {
    const id = req.user.id;
    const cachedUser = await redisRepo.getUserInfo(id);
    if(!cachedUser) {
       const dbUser = await userRepo.findByIdWithFollowersList(id);
      if(!dbUser) return next(new AppError(400, `user with user id ${id} not found`))
        user = dbUser;
      const out = await redisRepo.saveUserInfo(dbUser);
      if(!out) {
        logger.warn("could save user info to cache")
      }
    }
  else {
    user = cachedUser;
  }
    res.status(200).json({
  data: {
    user
  },
  error: null
  })
  } catch (error) {
    logger.debug("userController > getUserInfo() error", error);
    next(new AppError(500, "could not get user info"));
  }
}

export async function followUser(req: Request, res: Response, next: NextFunction) {
  const followerId = req.auth.user.id;
  const followingId = req.user.id;
  try {
   const out = await userRepo.follow(followerId, followingId);
   if(!out) return next(new AppError(500, `${followerId} could not follow ${followingId}`));
   else {
    const followingUserInfo = await userDb.query.followers.findFirst({
      where: (followers) => and(
        eq(followers.followerId, followerId),
        eq(followers.followingId, followingId)
      )
    });
    let out = await redisRepo.followUser(followerId, followingUserInfo!);
    if(!out) logger.warn("could could follow user in the cache")
   }
res.status(200).json({
error: null,
data: {
  response: "OK"
}
});
  } catch (error) {
    logger.debug("userController > followUser() error", error);
    next(new AppError(500, "could not follow user"));
  }

}

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  const followerId = req.auth.user.id;
  const followingId = req.user.id;
  try {
   const out = await userRepo.unfollow(followerId, followingId);
   if(!out) return next(new AppError(500, `${followerId} could not unfollow ${followingId}`));
res.status(200).json({
error: null,
data: {
  response: "OK"
}
});
  } catch (error) {
    logger.debug("userController > unFollowUser() error", error);
    next(new AppError(500, "could not unfollow user"));
  }
}