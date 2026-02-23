import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  (req as RequestWithId).requestId = randomUUID();
  const requestId = (req as RequestWithId).requestId;
  const start = Date.now();

  console.log(`[${requestId}] ${req.method} ${req.path}`);

  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${_res.statusCode} - ${duration}ms`);
  });

  next();
}
