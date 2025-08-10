import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { PlatformType } from '../../domain/enums/platform-type.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { TenantAuthGuard } from '../../infrastructure/guards/tenant-auth.guard';
import { GetBusinessAccountsUseCase } from '../../application/use-cases/meta/get-business-accounts.use-case';
import { GetMetaIntegrationUseCase } from '../../application/use-cases/meta/get-meta-integration.use-case';
import { GetMetaCatalogsUseCase } from '../../application/use-cases/meta/get-meta-catalogs.use-case';
import {
  MetaCatalogService,
  CreateProductRequest,
} from '../../infrastructure/external-services/meta/meta-catalog.service';
import { CreateMetaCatalogUseCase } from '../../application/use-cases/meta/create-meta-catalog.use-case';
import { CreateMetaCatalogDto } from '../dto/create-meta-catalog.dto';
import { DeleteMetaCatalogUseCase } from '../../application/use-cases/meta/delete-meta-catalog.use-case';

export const META_ACCESS_TOKEN =
  'EAAZAckPNd8QUBPONSUCAs7WroOZCAFDrrXWy7HyHBpKE30HBmpDOKRv13XZC71aBIrJCyeqWaE8qq8KBk8ZCk9MhmVAgXYZBI50zd7ZAkWZBRX475aBfbRGwZA9StLG9uYK4aD1uQgfb2HJMXBEU18Hapij7q8nZAuQZBGVbkaVs9keH9PRPlsP0gGYcHdogNjKLwKmd4diGN4tDV5cRjtOGxdYA7niPJazOVSzmVo';

@ApiTags('Meta Integration')
@Controller('meta')
@ApiBearerAuth()
@UseGuards(TenantAuthGuard)
export class MetaIntegrationController {
  constructor(
    private readonly getBusinessAccountsUseCase: GetBusinessAccountsUseCase,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
    private readonly getMetaCatalogsUseCase: GetMetaCatalogsUseCase,
    private readonly createMetaCatalogUseCase: CreateMetaCatalogUseCase,
    private readonly deleteMetaCatalogUseCase: DeleteMetaCatalogUseCase,
    private readonly metaCatalogService: MetaCatalogService,
  ) {}

  @Get('business/accounts')
  @ApiOperation({
    summary: 'Get Meta Business accounts',
    description: 'Retrieve available Meta Business accounts.',
  })
  async getBusinessAccounts(@Req() req: FastifyRequest) {
    const tenantId = (req as any).tenantId;
    const res = await this.getBusinessAccountsUseCase.execute({
      tenantId,
    });
    return res;
  }

  @Post('business/:businessId/catalogs')
  @ApiOperation({
    summary: 'Create new catalog',
    description: 'Create a new product catalog for a business account.',
  })
  @ApiParam({ name: 'businessId', description: 'Business Account ID' })
  @ApiBody({
    description: 'Catalog creation data',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Catalog name' },
        vertical: {
          type: 'string',
          enum: [
            'commerce',
            'hotels',
            'flights',
            'destinations',
            'home_listings',
            'vehicles',
            'media',
          ],
          default: 'commerce',
          description: 'Catalog vertical',
        },
        feed_count_limit: {
          type: 'number',
          description: 'Maximum number of feeds',
        },
        item_count_limit: {
          type: 'number',
          description: 'Maximum number of items',
        },
        additional_vertical_option: {
          type: 'string',
          enum: ['FOOD_DELIVERY'],
          description: 'Additional vertical option',
        },
      },
    },
  })
  async createCatalog(
    @Req() req: FastifyRequest,
    @Param('businessId') businessId: string,
    @Body() catalogData: CreateMetaCatalogDto,
  ) {
    const tenantId = (req as any).tenantId;
    const res = await this.createMetaCatalogUseCase.execute(
      tenantId,
      businessId,
      catalogData,
    );

    return res;
  }

  // @Put('catalogs/:catalogId')
  // @ApiOperation({
  //   summary: 'Update catalog',
  //   description: 'Update an existing catalog details.',
  // })
  // @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  // @ApiBody({
  //   description: 'Catalog update data',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       name: { type: 'string', description: 'Catalog name' },
  //       vertical: {
  //         type: 'string',
  //         enum: [
  //           'commerce',
  //           'hotels',
  //           'flights',
  //           'destinations',
  //           'home_listings',
  //           'vehicles',
  //           'media',
  //         ],
  //         description: 'Catalog vertical',
  //       },
  //       feed_count_limit: {
  //         type: 'number',
  //         description: 'Maximum number of feeds',
  //       },
  //       item_count_limit: {
  //         type: 'number',
  //         description: 'Maximum number of items',
  //       },
  //       additional_vertical_option: {
  //         type: 'string',
  //         enum: ['FOOD_DELIVERY'],
  //         description: 'Additional vertical option',
  //       },
  //     },
  //   },
  // })
  // async updateCatalog(
  //   @Req() req: FastifyRequest,
  //   @Param('catalogId') catalogId: string,
  //   @Body() catalogData: UpdateCatalogRequest,
  // ) {
  //   const integration = await this.getMetaIntegration((req as any).tenantId);

  //   return await this.metaCatalogService.updateCatalog(
  //     catalogId,
  //     catalogData,
  //     integration.accessToken,
  //   );
  // }

  @Delete('catalogs/:catalogId')
  @ApiOperation({
    summary: 'Delete catalog',
    description: 'Delete a catalog completely.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  async deleteCatalog(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
  ) {
    const tenantId = (req as any).tenantId;
    const res = await this.deleteMetaCatalogUseCase.execute(
      catalogId,
      tenantId,
    );

    return res;
  }

  @Get('catalogs')
  @ApiOperation({
    summary: 'Get Meta product catalogs',
    description: 'Retrieve product catalogs from Meta Business.',
  })
  @ApiQuery({
    name: 'businessId',
    required: false,
    description: 'Specific business ID to get catalogs for',
  })
  async getCatalogs(
    @Req() req: FastifyRequest,
    @Query('businessId') businessId?: string,
  ) {
    const tenantId = (req as any).tenantId;

    const res = await this.getMetaCatalogsUseCase.execute({
      tenantId,
      businessId,
    });

    return res;
  }

  @Get('catalogs/:catalogId')
  @ApiOperation({
    summary: 'Get catalog details',
    description: 'Get detailed information about a specific catalog.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  async getCatalogById(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.getCatalogById(
      catalogId,
      integration.accessToken,
    );
  }

  @Get('catalogs/:catalogId/products')
  @ApiOperation({
    summary: 'Get catalog products',
    description: 'Retrieve products from a specific catalog.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to retrieve (default: 25)',
  })
  @ApiQuery({
    name: 'after',
    required: false,
    description: 'Pagination cursor',
  })
  async getCatalogProducts(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
    @Query('limit') limit?: number,
    @Query('after') after?: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.getCatalogProducts(
      catalogId,
      integration.accessToken,
      limit || 25,
      after,
    );
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Get product details',
    description: 'Get detailed information about a specific product.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async getProduct(
    @Req() req: FastifyRequest,
    @Param('productId') productId: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.getProduct(
      productId,
      integration.accessToken,
    );
  }

  @Post('catalogs/:catalogId/products')
  @ApiOperation({
    summary: 'Create product',
    description: 'Create a new product in the specified catalog.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  async createProduct(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
    @Body() productData: CreateProductRequest,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.createProduct(
      catalogId,
      productData,
      integration.accessToken,
    );
  }

  @Put('products/:productId')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update an existing product.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async updateProduct(
    @Req() req: FastifyRequest,
    @Param('productId') productId: string,
    @Body() productData: Partial<CreateProductRequest>,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.updateProduct(
      productId,
      productData,
      integration.accessToken,
    );
  }

  @Delete('products/:productId')
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete a product from the catalog.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  async deleteProduct(
    @Req() req: FastifyRequest,
    @Param('productId') productId: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.deleteProduct(
      productId,
      integration.accessToken,
    );
  }

  @Post('catalogs/:catalogId/products/bulk')
  @ApiOperation({
    summary: 'Bulk upload products',
    description: 'Upload multiple products at once (up to 5000).',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  async bulkUploadProducts(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
    @Body() body: { products: CreateProductRequest[] },
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.bulkUploadProducts(
      catalogId,
      body.products,
      integration.accessToken,
    );
  }

  @Get('catalogs/:catalogId/products/search')
  @ApiOperation({
    summary: 'Search products',
    description: 'Search products in a catalog by name.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async searchProducts(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
    @Query('q') query: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.searchProducts(
      catalogId,
      query,
      integration.accessToken,
    );
  }

  @Get('catalogs/:catalogId/insights')
  @ApiOperation({
    summary: 'Get catalog analytics',
    description: 'Get catalog insights and analytics.',
  })
  @ApiParam({ name: 'catalogId', description: 'Catalog ID' })
  @ApiQuery({
    name: 'since',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'until',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  async getCatalogInsights(
    @Req() req: FastifyRequest,
    @Param('catalogId') catalogId: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    const dateRange = since && until ? { since, until } : undefined;

    return await this.metaCatalogService.getCatalogInsights(
      catalogId,
      integration.accessToken,
      dateRange,
    );
  }

  @Get('batch/:batchHandle/status')
  @ApiOperation({
    summary: 'Get batch upload status',
    description: 'Check the status of a bulk upload operation.',
  })
  @ApiParam({
    name: 'batchHandle',
    description: 'Batch handle returned from bulk upload',
  })
  async getBatchStatus(
    @Req() req: FastifyRequest,
    @Param('batchHandle') batchHandle: string,
  ) {
    const integration = await this.getMetaIntegration((req as any).tenantId);

    return await this.metaCatalogService.getBatchStatus(
      batchHandle,
      integration.accessToken,
    );
  }

  private async getMetaIntegration(tenantId: string) {
    const res = await this.getMetaIntegrationUseCase.execute({ tenantId });
    return res;
  }
}
