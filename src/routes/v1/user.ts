import { NextFunction, Request, Response, Router } from "express";
import { followUser, getUserInfo, saveUserMetadata, unfollowUser } from "../../controllers/http/user";
import { paramsValidation } from "../../middleware/http/global";
import { populateUserId } from "../../middleware/http/user";
import { AppError } from "../../errors";
import { errorMessage, errors } from "../../config";
import { authMiddleware } from "../../middleware/http/auth";

const userRouter = Router();

interface UserIdParams {
  id: string;
}

userRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  const body = req.body as {
    id: string;
  };
  if(!body.id) {
    return next(new AppError(400, errorMessage.get(errors.USER_NOT_FOUND)!))
  }
  next();
},  saveUserMetadata);
userRouter.get(
  "/:id",
  authMiddleware,
  paramsValidation<UserIdParams>,
  populateUserId,
  getUserInfo,
);

userRouter.post("/:id/follow", authMiddleware, paramsValidation<UserIdParams>, populateUserId, followUser);
userRouter.delete("/:id/unfollow", authMiddleware, paramsValidation<UserIdParams>, populateUserId, unfollowUser);
export default userRouter;
