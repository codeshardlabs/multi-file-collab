import { IRepository } from "..";

export interface ICommentRepository extends IRepository {
    getComments(id: number): Promise<Comment[] | null>;
}