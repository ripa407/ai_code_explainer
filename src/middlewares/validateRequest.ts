import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject } from 'zod';

function formatZodIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

const validateRequest =
  (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as {
        body?: Request['body'];
        query?: Request['query'];
        params?: Request['params'];
      };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      // Express 5: req.query is read-only; validation only (handlers read string query).
      if (parsed.params !== undefined) {
        req.params = parsed.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = formatZodIssues(error);
        const summary =
          issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ') ||
          'Validation Error';

        return res.status(400).json({
          status: 400,
          message: summary,
          data: null,
          errors: issues,
        });
      }

      return res.status(400).json({
        status: 400,
        message: 'Validation Error',
        data: null,
      });
    }
  };

export default validateRequest;
