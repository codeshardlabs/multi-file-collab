import { Request } from "express";
import { User } from "../../entities/user";
import {
  ShardModeType,
  ShardTemplateType,
  ShardTypeType,
} from "../../interfaces/repositories/shard";

// Adding custom property to Express Request: https://stackoverflow.com/questions/71122741/how-do-i-add-custom-property-to-express-request-in-typescript
declare module "express-serve-static-core" {
  interface Request {
    id: number;
    user: User;
  }
}

export interface UserPostRequestBody {
  id: string;
}

export interface ShardPostRequestBody {
  templateType: ShardTemplateType;
  mode: ShardModeType;
  type: ShardTypeType;
}
