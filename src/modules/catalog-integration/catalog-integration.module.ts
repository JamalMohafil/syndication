import { Module } from '@nestjs/common';
import { GoogleOAuthService } from './infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from './infrastructure/external-services/meta/meta-oauth.service';
import { GoogleMerchantService } from './infrastructure/external-services/google/google-merchant.service';
import { CatalogIntegrationService } from './application/services/catalog-integration.service';
import { CatalogIntegrationRepository } from './domain/repositories/catalog-integration.repository';
import { MongoCatalogIntegrationRepository } from './infrastructure/repositories/catalog-integration-mongo.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogIntegrationSchema } from './infrastructure/schemas/catalog-integration.schema';
import { IntegrationController } from './presentation/controllers/integration.controller';
import { MetaIntegrationController } from './presentation/controllers/meta.controller';
import { GoogleIntegrationController } from './presentation/controllers/google.controller';
import { OAuthController } from './presentation/controllers/oauth.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'catalog_integration', schema: CatalogIntegrationSchema },
    ]),
  ],
  controllers: [
    IntegrationController,
    MetaIntegrationController,
    GoogleIntegrationController,
    OAuthController,
  ],
  providers: [
    GoogleOAuthService,
    CatalogIntegrationService,
    {
      provide: CatalogIntegrationRepository,
      useClass: MongoCatalogIntegrationRepository,
    },
    MetaOAuthService,
    GoogleMerchantService,
  ],
  exports: [
    GoogleOAuthService,
    MetaOAuthService,
    GoogleMerchantService,
    CatalogIntegrationService,
  ],
})
export class CatalogIntegrationModule {}
