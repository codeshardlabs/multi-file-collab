import { NextFunction, Request, Response } from "express";
import { errorMessage, errors } from "../../config";

export async function idValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id = req.params["id"];
  if (!id) {
    res.status(400).json({
      data: null,
      error: {
        message: errorMessage.get(errors.ROOM_ID_NOT_FOUND),
      },
      status: {
        code: 400,
        message: "Bad Request",
      },
    });
    return;
  }
  req.id = Number(id);
  next();
}
