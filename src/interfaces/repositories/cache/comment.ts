import { IRepository } from "..";

export interface ICommentRepository extends IRepository {
  getComment(id: number): Promise<Comment | null>;
}
