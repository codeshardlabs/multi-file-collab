import { IRepository } from "..";
import { Comment } from "../../../entities/comment";

export interface ICommentRepository extends IRepository {
  getComment(commentId: number): Promise<Comment | null>;
}
