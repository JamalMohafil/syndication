import { Schema, Document } from 'mongoose';
import {
  CatalogIntegrationEntity,
  CatalogIntegrationProps,
} from '../../domain/entities/catalog-integration.entity';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { IntegrationStatus } from '../../domain/enums/integration-status.enum';

export type CatalogIntegrationDocument = CatalogIntegrationProps & Document;
export const CatalogIntegrationName = 'catalog_integration';
export const CatalogIntegrationSchema = new Schema<CatalogIntegrationDocument>(
  {
    tenantId: { type: String, required: true },
    platform: {
      type: String,
      required: true,
      enum: Object.values(PlatformType),
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiresAt: { type: Date },
    externalId: { type: String },
    status: {
      type: String,
      default: IntegrationStatus.PENDING,
      enum: Object.values(IntegrationStatus),
    },
    platformConfigs: { type: Map, of: Schema.Types.Mixed },
  },
  {
    collection: 'catalog_integrations',
    timestamps: true,
  },
);

CatalogIntegrationSchema.index({ tenantId: 1, platform: 1 }, { unique: true });
CatalogIntegrationSchema.index({ tenantId: 1, status: 1 });
