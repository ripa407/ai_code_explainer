import { Router } from 'express';

import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '../../type';
import { MediaController } from './media.controller';
import { uploadMiddleware } from './multer.config';
import {
  imageIdParamsZodSchema,
  listImagesQueryZodSchema,
  updateImageZodSchema,
  uploadImageZodSchema,
} from './media.zod';

const router = Router();

const adminAuth = auth(UserRole.SUPER_ADMIN, UserRole.ADMIN);

router.post(
  '/',
  adminAuth,
  uploadMiddleware,
  validateRequest(uploadImageZodSchema),
  MediaController.upload,
);

router.get(
  '/all',
  adminAuth,
  validateRequest(listImagesQueryZodSchema),
  MediaController.getAllImages,
);

router.get(
  '/:id',
  adminAuth,
  validateRequest(imageIdParamsZodSchema),
  MediaController.getImageById,
);

router.patch(
  '/:id',
  adminAuth,
  uploadMiddleware,
  validateRequest(updateImageZodSchema),
  MediaController.update,
);

router.delete(
  '/:id',
  adminAuth,
  validateRequest(imageIdParamsZodSchema),
  MediaController.remove,
);

export const mediaRouter = router;
