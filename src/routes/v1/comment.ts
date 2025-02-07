import { Router } from "express";
import { paramsValidation } from "../../middleware/http/global";
import { deleteComment } from "../../controllers/http/comment";
import { populateCommentId } from "../../middleware/http/comment";
import { AppError } from "../../errors";
import { errorMessage, errors } from "../../config";

const commentRouter = Router();

interface CommentIdParams {
  id: number;
}
commentRouter.delete(
  "/:id",
  paramsValidation<CommentIdParams>,
  populateCommentId,
  (req,res,next) => {
    if(!req.body.shardId) {
      return next(new AppError(400, errorMessage.get(errors.SHARD_ID_NOT_FOUND)!))
    }
    console.log(req.body);
    next()
  },
  deleteComment,
);

export default commentRouter;
