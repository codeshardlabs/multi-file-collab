import { Router } from "express";
import { getUserInfo, saveUserMetadata } from "../../controllers/http/user";
import { paramsValidation } from "../../middleware/http/global";
import { populateUserId } from "../../middleware/http/user";
import { AppError } from "../../errors";
import { errorMessage, errors } from "../../config";

const userRouter = Router();

interface UserIdParams {
  id: string;
}

userRouter.post("/", (req, res, next) => {
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
  paramsValidation<UserIdParams>,
  populateUserId,
  getUserInfo,
);

export default userRouter;
