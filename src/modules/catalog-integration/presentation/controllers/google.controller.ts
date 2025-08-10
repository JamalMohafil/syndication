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
import { GetMerchantAccountsUseCase } from '../../application/use-cases/google/get-merchant-accounts.use-case';
import { CreateDataFeedUseCase } from '../../application/use-cases/google/create-data-feed.use-case';
import { GetGoogleProductsUseCase } from '../../application/use-cases/google/get-google-products.use-case';
import { CheckDataFeedStatusUseCase } from '../../application/use-cases/google/check-data-feed-status.use-case';

@ApiTags('Google Integration')
@Controller('google')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class GoogleIntegrationController {
  constructor(
    private readonly getMerchantAccountsUseCase: GetMerchantAccountsUseCase,
    private readonly createDataFeedUseCase: CreateDataFeedUseCase,
    private readonly checkDataFeedStatusUseCase: CheckDataFeedStatusUseCase,
    private readonly getGoogleProductsUseCase: GetGoogleProductsUseCase,
  ) {}

  @Get('merchant/accounts')
  @ApiOperation({
    summary: 'Get Google Merchant Center accounts',
    description: 'Retrieve available Google Merchant Center accounts.',
  })
  async getMerchantAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;

    const res = await this.getMerchantAccountsUseCase.execute({ tenantId });
    return res;
  }
  
  @Get('datafeedStatus')
  async getDatafeedStatus(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;

    const res = await this.checkDataFeedStatusUseCase.execute(tenantId);
    return res;
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

    const res = await this.createDataFeedUseCase.execute({
      feedName: createFeedDto.feedName,
      feedUrl: createFeedDto.feedUrl,
      tenantId,
    });
    return res;
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

    const res = await this.getGoogleProductsUseCase.execute({
      tenantId,
      merchantId,
    });
    return res;
  }
}
