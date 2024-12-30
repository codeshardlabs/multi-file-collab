import { NextFunction, Request, Response } from "express";
import { errorMessage, errors } from "../../config";

// Adding custom property to Express Request: https://stackoverflow.com/questions/71122741/how-do-i-add-custom-property-to-express-request-in-typescript
declare module "express-serve-static-core" {
    interface Request {
      id?: string;
    }
}

export async function idValidation(req: Request, res: Response, next: NextFunction) {
    const id = req.params["id"];
    if (!id) {
        res.status(400).json({
            data: null,
            error: {
                message: errorMessage.get(errors.ROOM_ID_NOT_FOUND)
            },
            status: {
                code: 400,
                message: "Bad Request"
            }
        });
        return;
    }
    req.id = id;
    next();
}