import type { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '../../utils/catchAsync';
import { getRouteParam } from '../../utils/getRouteParam';
import sendResponse from '../../utils/sendResponse';
import { MediaService } from './media.service';

const upload = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  const alt = typeof req.body?.alt === 'string' ? req.body.alt : undefined;
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, httpStatus.UNAUTHORIZED, 'Unauthorized', null);
  }

  const image = await MediaService.uploadImage(userId, file as Express.Multer.File, alt);

  return sendResponse(res, httpStatus.CREATED, 'Image uploaded successfully', image);
});

const getAllImages = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await MediaService.getAllImages({ page, limit });

  return sendResponse(res, httpStatus.OK, 'Images retrieved successfully', result);
});

const getImageById = catchAsync(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params, 'id');
  const image = await MediaService.getImageById(id);

  return sendResponse(res, httpStatus.OK, 'Image retrieved successfully', image);
});

const update = catchAsync(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params, 'id');
  const file = req.file;
  const alt = typeof req.body?.alt === 'string' ? req.body.alt : undefined;
  const userId = req.user?.id;

  if (!userId) {
    return sendResponse(res, httpStatus.UNAUTHORIZED, 'Unauthorized', null);
  }

  const image = await MediaService.updateImage(
    id,
    userId,
    file as Express.Multer.File,
    alt,
  );

  return sendResponse(res, httpStatus.OK, 'Image updated successfully', image);
});

const remove = catchAsync(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params, 'id');
  await MediaService.deleteImage(id);

  return sendResponse(res, httpStatus.OK, 'Image deleted successfully', null);
});

export const MediaController = {
  upload,
  getAllImages,
  getImageById,
  update,
  remove,
};
