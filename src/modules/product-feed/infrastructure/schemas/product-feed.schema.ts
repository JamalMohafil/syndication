import { Schema, Document } from 'mongoose';
import {
  ProductFeedEntity,
  ProductFeedProps,
} from '../../domain/entities/product-feed.entity';
import { FileType } from '../../domain/enums/file-type.enum';
import { FeedStatus } from '../../domain/enums/feed-status.enum';

export type ProductFeedDocument = ProductFeedProps & Document;
export const ProductFeedName = 'product_feed';
export const ProductFeedSchema = new Schema<ProductFeedDocument>(
  {
    tenantId: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true, enum: Object.values(FileType) },
    fileSize: { type: Number, required: true },
    totalProducts: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: Object.values(FeedStatus),
      default: FeedStatus.PENDING,
    },
    createdBy: { type: String, required: true },
    errorMessage: { type: String },
  },
  {
    collection: 'product_feeds',
    timestamps: true,
  },
);
