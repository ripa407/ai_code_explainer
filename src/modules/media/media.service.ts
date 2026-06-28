import httpStatus from 'http-status';

import AppError from '../../errors/AppError';
import { FILE_UPLOAD } from '../../lib/file-upload';
import type { IImage } from './image.interface';
import { Image } from './image.model';
import {
  DeleteObjectCommand,
  getR2BucketName,
  getR2BucketUrl,
  getR2Client,
  PutObjectCommand,
} from './r2.client';

const generateR2Key = (originalName: string): string => {
  const ext = originalName.split('.').pop() || 'bin';
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `images/${uniqueId}.${ext}`;
};

const uploadToR2 = async (
  buffer: Buffer,
  r2Key: string,
  contentType: string,
): Promise<void> => {
  const client = getR2Client();
  const bucketName = getR2BucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
};

const deleteFromR2 = async (r2Key: string): Promise<void> => {
  const client = getR2Client();
  const bucketName = getR2BucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
    }),
  );
};

const saveImageToDb = async (
  userId: string,
  name: string,
  url: string,
  r2Key: string,
  alt?: string,
): Promise<IImage> => {
  const doc = await Image.create({
    userId,
    name,
    url,
    r2_key: r2Key,
    alt: alt || '',
  });

  return doc.toObject() as IImage;
};

const assertValidObjectId = (id: string, message = 'Invalid id') => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError(message, httpStatus.BAD_REQUEST);
  }
};

const validateFile = (file?: Express.Multer.File) => {
  if (!file?.buffer) {
    throw new AppError('No file provided', httpStatus.BAD_REQUEST);
  }

  if (file.size > FILE_UPLOAD.MAX_SIZE) {
    throw new AppError('File is too large (max 10MB)', httpStatus.BAD_REQUEST);
  }

  const allowedTypes = FILE_UPLOAD.ALLOWED_IMAGE_TYPES;
  if (!allowedTypes.includes(file.mimetype as (typeof allowedTypes)[number])) {
    throw new AppError(
      'Unsupported file type. Allowed: JPEG, PNG, WebP',
      httpStatus.BAD_REQUEST,
    );
  }

  return file;
};

const uploadImage = async (
  userId: string,
  file: Express.Multer.File,
  alt?: string,
): Promise<IImage> => {
  assertValidObjectId(userId, 'Invalid user id');
  const validFile = validateFile(file);

  const r2Key = generateR2Key(validFile.originalname);
  const bucketUrl = getR2BucketUrl().replace(/\/$/, '');
  const url = `${bucketUrl}/${r2Key}`;

  await uploadToR2(validFile.buffer, r2Key, validFile.mimetype);

  return saveImageToDb(userId, validFile.originalname, url, r2Key, alt);
};

const getAllImages = async (query: { page?: number; limit?: number }) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [images, total] = await Promise.all([
    Image.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    Image.countDocuments(),
  ]);

  return {
    images: images as IImage[],
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getImageById = async (imageId: string): Promise<IImage> => {
  assertValidObjectId(imageId, 'Invalid image id');

  const image = await Image.findById(imageId).lean().exec();
  if (!image) {
    throw new AppError('Image not found', httpStatus.NOT_FOUND);
  }

  return image as IImage;
};

const deleteImage = async (imageId: string): Promise<void> => {
  assertValidObjectId(imageId, 'Invalid image id');

  const image = await Image.findById(imageId).lean().exec();
  if (!image) {
    throw new AppError('Image not found', httpStatus.NOT_FOUND);
  }

  await deleteFromR2(image.r2_key);
  await Image.findByIdAndDelete(imageId).exec();
};

const updateImage = async (
  imageId: string,
  userId: string,
  file: Express.Multer.File,
  alt?: string,
): Promise<IImage> => {
  assertValidObjectId(imageId, 'Invalid image id');
  assertValidObjectId(userId, 'Invalid user id');
  const validFile = validateFile(file);

  const oldImage = await Image.findById(imageId).lean().exec();
  if (!oldImage) {
    throw new AppError('Image not found', httpStatus.NOT_FOUND);
  }

  if (String(oldImage.userId) !== String(userId)) {
    throw new AppError('You are not authorized to update this image', httpStatus.FORBIDDEN);
  }

  const newR2Key = generateR2Key(validFile.originalname);
  const bucketUrl = getR2BucketUrl().replace(/\/$/, '');
  const newUrl = `${bucketUrl}/${newR2Key}`;

  await uploadToR2(validFile.buffer, newR2Key, validFile.mimetype);

  const updated = await Image.findByIdAndUpdate(
    imageId,
    {
      $set: {
        userId,
        name: validFile.originalname,
        url: newUrl,
        r2_key: newR2Key,
        ...(alt !== undefined && { alt }),
      },
    },
    { new: true },
  )
    .lean()
    .exec();

  if (!updated) {
    throw new AppError('Image not found', httpStatus.NOT_FOUND);
  }

  await deleteFromR2(oldImage.r2_key);

  return updated as IImage;
};

export const MediaService = {
  uploadImage,
  getAllImages,
  getImageById,
  deleteImage,
  updateImage,
};
