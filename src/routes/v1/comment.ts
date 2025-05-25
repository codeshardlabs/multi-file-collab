import { Router } from "express";
import { paramsValidation } from "../../middleware/http/global";
import { deleteComment, editComment } from "../../controllers/http/comment";
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
  deleteComment
);

commentRouter.put(
  "/:id",
  paramsValidation<CommentIdParams>,
  populateCommentId,
  editComment
);
export default commentRouter;
