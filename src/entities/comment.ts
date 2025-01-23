import { comments } from "../db/tables/comments";

export type Comment = typeof comments.$inferSelect;
