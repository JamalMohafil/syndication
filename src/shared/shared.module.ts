import { Module } from '@nestjs/common';
import { GoogleMerchantService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-merchant.service';
import { GoogleOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/google/google-oauth.service';
import { MetaOAuthService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-oauth.service';
import { ConfigModule } from '@nestjs/config';
import metaConfig from './infrastructure/config/meta.config';
import googleConfig from './infrastructure/config/google.config';
import appConfig from './infrastructure/config/app.config';
import { RedisService } from './infrastructure/database/redis/redis.service';
import redisConfig from './infrastructure/database/redis/config/redis.config';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, metaConfig, googleConfig, redisConfig],
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT as unknown as number,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  
  ],
  providers: [
    GoogleOAuthService,
    RedisService,
    GoogleMerchantService,
    MetaOAuthService,
  ],
  exports: [
    GoogleOAuthService,
    RedisService,
    GoogleMerchantService,
    MetaOAuthService,
  ],
})
export class SharedModule {}
