// auth.middleware.ts

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

const auth =
  (...requiredRoles: string[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new AppError(
          'Authorization token is required',
          httpStatus.UNAUTHORIZED,
        );
      }

      const token = authorization.split(' ')[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string,
      ) as {
        id: string;
        name: string;
        email: string;
        role: string;
      };

      req.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      };

      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        throw new AppError('You are not authorized', httpStatus.FORBIDDEN);
      }

      next();
    } catch {
      next(new AppError('Invalid or expired token', httpStatus.UNAUTHORIZED));
    }
  };

export default auth;
