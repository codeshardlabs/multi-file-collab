import { Request } from "express";

import {User} from "../../src/entities/user";

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
