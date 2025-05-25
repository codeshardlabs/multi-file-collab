import { eq } from "drizzle-orm";
import { CommentDbType } from "../../../db";
import { Comment, Reply, ReplyInput } from "../../../entities/comment";
import { comments, replies } from "../../../db/tables";
import { logger } from "../../../services/logger/logger";

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

  async addReply(reply: ReplyInput): Promise<Reply | null> {
    try {

      await this.db.transaction(async (tx) => {

        const comment = await tx.insert(comments).values({
          message: reply.message,
          shardId: reply.shardId,
          userId: reply.userId
        }).returning();

        try {
          const out = await tx.insert(replies).values({
            repliedBy: reply.repliedBy,
            repliedTo: comment[0].id
          }).returning();

          return out[0];
        } catch (error) {
          logger.error("Error adding reply", error);
          return null;
        }
      });
      return null;
    } catch (error) {
      logger.error("Error adding reply", error);
      return null;
    }
  }
}


export default CommentRepository;
