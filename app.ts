import express from 'express';
import { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { UserRoutes } from './src/modules/user/user.router';
import { authRouter } from './src/modules/auth/auth.router';
import { mediaRouter } from './src/modules/media/media.router';
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});
app.use('/api/v1/user', UserRoutes);
app.use('/api/auth', authRouter);
app.use('/api/v1/media', mediaRouter);

import AppError from './src/errors/AppError';
// 404 handler for unknown routes
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

import globalErrorHandler from './src/middlewares/globalErrorHandler';
app.use(globalErrorHandler);
export default app;
