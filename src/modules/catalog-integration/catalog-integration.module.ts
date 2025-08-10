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
import { GenerateAuthUrlUseCase } from './application/use-cases/auth/generate-auth-url.use-case';
import { GetMerchantAccountsUseCase } from './application/use-cases/google/get-merchant-accounts.use-case';
import { RefreshTokensUseCase } from './application/use-cases/auth/refresh-tokens.use-case';
import { TestConnectionUseCase } from './application/use-cases/auth/test-connection.use-case';
import { GetIntergrationsUseCase } from './application/use-cases/integration/get-integrations.use-case';
import { HandleOAuthCallbackUseCase } from './application/use-cases/auth/handle-oauth-callback.use-case';
import { GetMetaCatalogsUseCase } from './application/use-cases/meta/get-meta-catalogs.use-case';
import { GetBusinessAccountsUseCase } from './application/use-cases/meta/get-business-accounts.use-case';
import { GetMetaIntegrationUseCase } from './application/use-cases/meta/get-meta-integration.use-case';
import { CreateDataFeedUseCase } from './application/use-cases/google/create-data-feed.use-case';
import { GetGoogleProductsUseCase } from './application/use-cases/google/get-google-products.use-case';
import { GetPlatformIntegrationUseCase } from './application/use-cases/integration/get-platform-integration.use-case';
import { DisconnectIntegrationUseCase } from './application/use-cases/integration/disconnect-integration.use-case';
import { GetIntegrationSummaryUseCase } from './application/use-cases/integration/get-integration-summary.use-case';
import { RefreshExpiredTokensUseCase } from './application/use-cases/integration/refresh-expired-tokens.use-case';
import { GetTenantIntegrationsUseCase } from './application/use-cases/integration/get-tenant-integrations.use-case';
import { TokenRefreshScheduler } from './infrastructure/schedulers/token-refresh.scheduler';
import { TokenRefreshProcessor } from './infrastructure/processors/token-refresh.processor';
import { BullModule } from '@nestjs/bullmq';
import { MetaCatalogService } from './infrastructure/external-services/meta/meta-catalog.service';
import { CheckDataFeedStatusUseCase } from './application/use-cases/google/check-data-feed-status.use-case';
import { CreateMetaCatalogUseCase } from './application/use-cases/meta/create-meta-catalog.use-case';

const useCases = [
  GenerateAuthUrlUseCase,
  GetMerchantAccountsUseCase,
  RefreshTokensUseCase,
  TestConnectionUseCase,
  GetIntergrationsUseCase,
  HandleOAuthCallbackUseCase,
  GetMetaCatalogsUseCase,
  GetBusinessAccountsUseCase,
  GetMetaIntegrationUseCase,
  GetGoogleProductsUseCase,
  GetPlatformIntegrationUseCase,
  DisconnectIntegrationUseCase,
  GetIntegrationSummaryUseCase,
  RefreshExpiredTokensUseCase,
  GetTenantIntegrationsUseCase,
  CheckDataFeedStatusUseCase,
  CreateMetaCatalogUseCase,
  CreateDataFeedUseCase,
];
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'catalog_integration', schema: CatalogIntegrationSchema },
    ]),
    BullModule.registerQueue({
      name: 'refresh-tokens-job',
    }),
  ],
  controllers: [
    IntegrationController,
    MetaIntegrationController,
    GoogleIntegrationController,
    OAuthController,
  ],
  providers: [
    GoogleOAuthService,
    MetaCatalogService,
    CatalogIntegrationService,
    TokenRefreshScheduler,
    TokenRefreshProcessor,
    ...useCases,
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
    ...useCases,
    MetaCatalogService,
    CatalogIntegrationService,
    TokenRefreshProcessor,
    TokenRefreshScheduler,
  ],
})
export class CatalogIntegrationModule {}
