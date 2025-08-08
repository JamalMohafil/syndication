import { Module } from '@nestjs/common';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';

@Module({
  providers: [
    GoogleOAuthService,
    GoogleMerchantService,
    // GoogleAdsService,
    MetaOAuthService,
    // MetaCatalogService,
    // MetaPixelService,
  ],
  exports: [
    GoogleOAuthService,
    GoogleMerchantService,
    // GoogleAdsService,
    MetaOAuthService,
    // MetaCatalogService,
    // MetaPixelService,
  ],
})
export class SharedModule {}
