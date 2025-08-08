import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'tenants',
})
export class TenantDocument extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, default: 'en' })
  defaultLanguage: string;

  @Prop({ required: true, default: 'USD' })
  defaultCurrency: string;

  @Prop({ required: true, default: 'UTC' })
  timezone: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(TenantDocument);
