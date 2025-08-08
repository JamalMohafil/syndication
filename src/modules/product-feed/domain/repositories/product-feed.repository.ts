import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { ProductFeedEntity } from '../entities/product-feed.entity';
import { FeedStatus } from '../enums/feed-status.enum';

export interface ProductFeedRepository
  extends BaseRepository<ProductFeedEntity> {
  findByTenantId(tenantId: string): Promise<ProductFeedEntity[]>;
  findByStatus(status: FeedStatus): Promise<ProductFeedEntity[]>;
  findPendingFeeds(): Promise<ProductFeedEntity[]>;
}
