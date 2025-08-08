import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductFeedService } from '../../application/services/product-feed.service';
import { FeedBuilderService } from '../../application/services/feed-builder.service';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Feed URLs')
@Controller('feeds')
export class FeedUrlController {
  constructor(
    private readonly productFeedService: ProductFeedService,
    private readonly feedBuilderService: FeedBuilderService,
  ) {}

  @Get(':fileName')
  @ApiOperation({ summary: 'Serve feed file' })
  @ApiParam({ name: 'fileName', description: 'Feed file name' })
  async serveFeedFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'feeds', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Feed file not found',
        });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const contentType = fileName.endsWith('.xml')
        ? 'application/xml'
        : 'text/csv';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(fileContent);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error serving feed file',
        error: error.message,
      });
    }
  }

  @Get('generate/:tenantId/:platform')
  @ApiOperation({ summary: 'Generate dynamic feed URL for platform' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiParam({ name: 'platform', description: 'Platform (google|meta)' })
  async generateDynamicFeed(
    @Param('tenantId') tenantId: string,
    @Param('platform') platform: string,
    @Res() res: Response,
  ) {
    try {
      const products = this.feedBuilderService.generateDemoProducts(tenantId);

      let feedContent: string;
      let contentType: string;

      if (platform.toLowerCase() === 'google') {
        feedContent = this.feedBuilderService.generateGoogleFeedXML(products);
        contentType = 'application/xml';
      } else if (platform.toLowerCase() === 'meta') {
        feedContent = this.feedBuilderService.generateMetaFeedCSV(products);
        contentType = 'text/csv';
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Invalid platform. Use "google" or "meta"',
        });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
      res.send(feedContent);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error generating dynamic feed',
        error: error.message,
      });
    }
  }
}
