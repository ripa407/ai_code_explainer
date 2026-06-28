import { Schema, model } from 'mongoose';

import type { IImage } from './image.interface';

const imageSchema = new Schema<IImage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    r2_key: { type: String, required: true, unique: true },
    alt: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const Image = model<IImage>('Image', imageSchema);
