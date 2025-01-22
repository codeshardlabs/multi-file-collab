import { NextFunction, Request, Response } from "express";
import { logger } from "../../services/logger/logger";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err.stack!);
  res.status(500).json({ error: 'Internal Server Error' });
}

export function paramsValidation<T>(req: Request, res: Response, next: NextFunction) {
  const missingFields: string[] = [];

  // Iterate over the keys of the interface T
  for (const key of Object.keys(req.params) as Array<keyof T>) {
    if (!req.params[key as string]) {
      missingFields.push(key as string);
    }
  }

  if (missingFields.length > 0) {
     res.status(400).json({
      error: {
        message: `Missing fields: ${missingFields.join(', ')}`,
      },
      data: null,
      status: 400,
    });
    return;
  }

  next();
}