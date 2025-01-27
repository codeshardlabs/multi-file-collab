import { Router } from "express";
import { getUserInfo, saveUserMetadata } from "../../controllers/http/user";
import { paramsValidation } from "../../middleware/http/global";
import { populateUserId } from "../../middleware/http/user";

const userRouter = Router();

interface UserIdParams {
  id: string;
}

userRouter.post("/", saveUserMetadata);
userRouter.get(
  "/:id",
  paramsValidation<UserIdParams>,
  populateUserId,
  getUserInfo,
);

export default userRouter;
