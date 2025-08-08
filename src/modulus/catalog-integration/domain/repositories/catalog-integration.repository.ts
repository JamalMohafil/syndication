import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { CatalogIntegrationEntity } from '../entities/catalog-integration.entity';
import { PlatformType } from '../enums/platform-type.enum';

export interface CatalogIntegrationRepository
  extends BaseRepository<CatalogIntegrationEntity> {
  findByTenantId(tenantId: string): Promise<CatalogIntegrationEntity[]>;
  findByTenantAndPlatform(
    tenantId: string,
    platform: PlatformType,
  ): Promise<CatalogIntegrationEntity | null>;
  findExpiredTokens(): Promise<CatalogIntegrationEntity[]>;
}
