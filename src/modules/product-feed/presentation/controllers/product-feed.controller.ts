import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductFeedService } from '../../application/services/product-feed.service';
import { FileType } from '../../domain/enums/file-type.enum';
import { IsString } from 'class-validator';
import { GenerateDemoFeedDto } from '../dto/generate-demo-feed.dto';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';

@ApiTags('Product Feeds')
@Controller('product-feeds')
export class ProductFeedController {
  constructor(private readonly productFeedService: ProductFeedService) {}

  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate demo product feed' })
  @ApiResponse({ status: 201, description: 'Demo feed generated successfully' })
  async generateDemoFeed(@Body() generateDto: GenerateDemoFeedDto) {
    const feed = await this.productFeedService.generateDemoFeed(
      generateDto.tenantId,
      generateDto.fileType,
    );
    return feed.toJSON();
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all feeds for a tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  async getTenantFeeds(@Param('tenantId') tenantId: string) {
    const feeds = await this.productFeedService.getTenantFeeds(tenantId);
    return feeds.map((feed) => feed.toJSON());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feed by ID' })
  @ApiParam({ name: 'id', description: 'Feed ID' })
  async getFeedById(@Param('id') id: string) {
    const feed = await this.productFeedService.getFeedById(id);
    if (!feed) {
      throw new NotFoundDomainException('Feed not found');
    }
    return feed.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete feed' })
  @ApiParam({ name: 'id', description: 'Feed ID' })
  async deleteFeed(@Param('id') id: string) {
    await this.productFeedService.deleteFeed(id);
  }
}
