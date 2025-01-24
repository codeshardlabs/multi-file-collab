import { NextFunction, Request, Response } from "express";
import { userRepo } from "../../db";
import { logger } from "../../services/logger/logger";
import { AppError } from "../../errors";

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
  try {
    const id = req.user.id;
    const user = await userRepo.findByIdWithFollowersList(id);
    if(!user) return next(new AppError(400, `user with user id ${id} not found`))
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