import multer from 'multer';
import type { Request, RequestHandler } from 'express';

import { FILE_UPLOAD } from '../../lib/file-upload';

const storage = multer.memoryStorage();
const allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedTypes.includes(file.mimetype as (typeof allowedTypes)[number])) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: FILE_UPLOAD.MAX_SIZE },
  fileFilter,
});

export const uploadMiddleware: RequestHandler = upload.single('image');
