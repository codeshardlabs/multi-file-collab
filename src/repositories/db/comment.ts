import { eq } from "drizzle-orm";
import { CommentDbType } from "../../db";
import { Comment } from "../../entities/comment";

class CommentRepository {
  private db: CommentDbType;
  constructor(commentDb: CommentDbType) {
    this.db = commentDb;
  }

  async getComment(commentId: number): Promise<Comment | null> {
    const comment = await this.db.query.comments.findFirst({
      where: (comments) => eq(comments.id, commentId),
    });
    if (!comment) return null;
    return comment;
  }
}

export default CommentRepository;
