import { Request } from "express";
import { User } from "../../entities/user";
import {
  ShardModeType,
  ShardTemplateType,
  ShardTypeType,
} from "../../interfaces/repositories/db/shard";

// Adding custom property to Express Request: https://stackoverflow.com/questions/71122741/how-do-i-add-custom-property-to-express-request-in-typescript
declare module "express-serve-static-core" {
  interface Request {
    shard: {
      id: number;
    };
    auth: {
      user: User;
    };
    user: {
      id: string;
    },
    comment: {
      id: number;
    }
  }
}
