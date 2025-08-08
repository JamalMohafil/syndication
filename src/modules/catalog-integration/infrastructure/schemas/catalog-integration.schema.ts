import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { IntegrationStatus } from '../../domain/enums/integration-status.enum';

@Schema({ timestamps: true, collection: 'catalog_integrations' })
export class CatalogIntegrationDocument extends Document {
  @Prop({ required: true }) tenantId: string;
  @Prop({ required: true, enum: PlatformType }) platform: PlatformType;
  @Prop({ required: true }) accessToken: string;
  @Prop() refreshToken?: string;
  @Prop() tokenExpiresAt?: Date;
  @Prop() externalId?: string;
  @Prop({ default: IntegrationStatus.PENDING, enum: IntegrationStatus })
  status: IntegrationStatus;

  @Prop({ type: Map, of: mongoose.Schema.Types.Mixed })
  platformConfigs: Record<string, any>;
}

export const CatalogIntegrationSchema = SchemaFactory.createForClass(
  CatalogIntegrationDocument,
);

CatalogIntegrationSchema.index({ tenantId: 1, platform: 1 }, { unique: true });

CatalogIntegrationSchema.index({ tenantId: 1, status: 1 });
