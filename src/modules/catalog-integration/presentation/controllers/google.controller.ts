import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { GoogleMerchantService } from '../../infrastructure/external-services/google/google-merchant.service';
import { CreateDataFeedDto } from '../dto/create-data-feed.dto';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import { FastifyRequest } from 'fastify';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';
import { CatalogIntegrationService } from '../../application/services/catalog-integration.service';
import { GoogleOAuthService } from '../../infrastructure/external-services/google/google-oauth.service';

@ApiTags('Google Integration')
@Controller('google')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class GoogleIntegrationController {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
    private readonly googleMerchantService: GoogleMerchantService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  @Get('merchant/accounts')
  @ApiOperation({
    summary: 'Get Google Merchant Center accounts',
    description: 'Retrieve available Google Merchant Center accounts.',
  })
  async getMerchantAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;
    const integration = await this.getGoogleIntegration(tenantId);

    // Set credentials for the Google OAuth service
    this.googleOAuthService.setCredentials(
      integration.accessToken,
      integration.refreshToken,
    );

    return await this.googleMerchantService.getMerchantCenterAccounts(
      integration.accessToken,
    );
  }

  @Post('datafeed')
  @ApiOperation({
    summary: 'Create Google Shopping datafeed',
    description: 'Create a new datafeed in Google Merchant Center.',
  })
  async createDataFeed(
    @Body() createFeedDto: CreateDataFeedDto,
    @Req() req: FastifyRequest,
  ) {
    const tenantId = (req as any).tenantId;
    const integration = await this.getGoogleIntegration(tenantId);

    const merchantId = createFeedDto.merchantId || integration.externalId;
    if (!merchantId) {
      throw new BadRequestDomainException('Merchant ID is required');
    }

    // Set credentials
    this.googleOAuthService.setCredentials(
      integration.accessToken,
      integration.refreshToken,
    );

    return await this.googleMerchantService.createDataFeed(
      integration.accessToken,
      merchantId,
      createFeedDto.feedName,
      createFeedDto.feedUrl,
    );
  }

  @Get('products')
  @ApiOperation({
    summary: 'Get Google Merchant products',
    description: 'Retrieve products from Google Merchant Center.',
  })
  async getProducts(
    @Req() req: FastifyRequest,
    @Query('merchantId') merchantId?: string,
  ) {
    const tenantId = (req as any).tenantId;
    const integration = await this.getGoogleIntegration(tenantId);

    const finalMerchantId = merchantId || integration.externalId;
    if (!finalMerchantId) {
      throw new BadRequestDomainException('Merchant ID is required');
    }

    // Set credentials
    this.googleOAuthService.setCredentials(
      integration.accessToken,
      integration.refreshToken,
    );

    return await this.googleMerchantService.getProducts(
      integration.accessToken,
      finalMerchantId,
    );
  }

  private async getGoogleIntegration(tenantId: string) {
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);
    const googleIntegration = integrations.find(
      (int) => int.platform === PlatformType.GOOGLE,
    );

    if (!googleIntegration) {
      throw new NotFoundDomainException('Google integration not found');
    }

    return googleIntegration;
  }
}
