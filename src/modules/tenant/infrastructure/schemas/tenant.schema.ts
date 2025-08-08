import { Schema, Document } from 'mongoose';
import { TenantEntity, TenantProps } from '../../domain/entities/tenant.entity';
 
export type TenantDocument = TenantProps & Document;
export const TenantDocumentName = 'tenant';
export const TenantSchema = new Schema<TenantDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    defaultLanguage: { type: String, required: true, default: 'en' },
    defaultCurrency: { type: String, required: true, default: 'USD' },
    timezone: { type: String, required: true, default: 'UTC' },
    isActive: { type: Boolean, required: true, default: true },
  },
  {
    collection: 'tenants',
    timestamps: true,
  },
);
