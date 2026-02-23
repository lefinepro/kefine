import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestLogger(
  req: RequestWithId,
  _res: Response,
  next: NextFunction
): void {
  req.requestId = randomUUID();
  const start = Date.now();

  console.log(`[${req.requestId}] ${req.method} ${req.path}`);

  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.requestId}] ${_res.statusCode} - ${duration}ms`);
  });

  next();
}
