import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { ProductFeedEntity } from '../entities/product-feed.entity';
import { FeedStatus } from '../enums/feed-status.enum';

export abstract class ProductFeedRepository extends BaseRepository<ProductFeedEntity> {
  abstract findByTenantId(tenantId: string): Promise<ProductFeedEntity[]>;
  abstract findByStatus(status: FeedStatus): Promise<ProductFeedEntity[]>;
  abstract findPendingFeeds(): Promise<ProductFeedEntity[]>;
}
