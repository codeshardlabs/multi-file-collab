import { Router } from "express";
import { paramsValidation } from "../../middleware/http/global";
import { deleteComment } from "../../controllers/http/comment";
import { populateCommentId } from "../../middleware/http/comment";


const commentRouter = Router();

interface CommentIdParams {
    id: number;
}
commentRouter.delete("/:id", paramsValidation<CommentIdParams>, populateCommentId, deleteComment);