import { comments, replies } from "../db/tables";
import { CommentInput } from "../interfaces/repositories/db/shard";

export type Comment = typeof comments.$inferSelect;
export type Reply = typeof replies.$inferSelect;


export interface ReplyInput extends CommentInput{
    repliedTo: number;
    repliedBy: number;
}