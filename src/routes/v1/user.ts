import { Router } from "express";
import { saveUserMetadata } from "../../controllers/http/user";


const userRouter = Router();

userRouter.post("/", saveUserMetadata);


export default userRouter;