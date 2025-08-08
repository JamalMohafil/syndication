import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { FileType } from '../../domain/enums/file-type.enum';
import { FeedStatus } from '../../domain/enums/feed-status.enum';

@Schema({
  timestamps: true,
  collection: 'product_feeds',
})
export class ProductFeedDocument extends Document {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true, enum: FileType })
  fileType: FileType;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true, default: 0 })
  totalProducts: number;

  @Prop({ required: true, enum: FeedStatus, default: FeedStatus.PENDING })
  status: FeedStatus;

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  errorMessage?: string;
}

export const ProductFeedSchema =
  SchemaFactory.createForClass(ProductFeedDocument);
