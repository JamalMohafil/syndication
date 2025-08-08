import { Module } from '@nestjs/common';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';
import { ConfigModule } from '@nestjs/config';
import metaConfig from './infrastructure/config/meta.config';
import googleConfig from './infrastructure/config/google.config';
import appConfig from './infrastructure/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, metaConfig, googleConfig],
      isGlobal: true,
    }),
  ],
  providers: [GoogleOAuthService, GoogleMerchantService, MetaOAuthService],
  exports: [GoogleOAuthService, GoogleMerchantService, MetaOAuthService],
})
export class SharedModule {}
