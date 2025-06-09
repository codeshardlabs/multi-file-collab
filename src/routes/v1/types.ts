import { Request } from "express";
import { User } from "../../entities/user";

declare global {
  namespace Express {
    interface Request {
      shard: {
        id: number;
      };
      auth: {
        user: User;
      };
      user: {
        id: string;
      };
      comment: {
        id: number;
      };
      pagination: {
        limit: number;
        offset: number;
      };
    }
  }
}
