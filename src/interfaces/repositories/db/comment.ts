import { Comment } from "../../../entities/comment";


export interface ICommentRepository {
    getComment(commentId: number) : Promise<Comment | null>
}