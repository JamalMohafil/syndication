import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { CatalogIntegrationEntity } from '../entities/catalog-integration.entity';
import { PlatformType } from '../enums/platform-type.enum';

export abstract class CatalogIntegrationRepository extends BaseRepository<CatalogIntegrationEntity> {
  abstract findByTenantId(
    tenantId: string,
  ): Promise<CatalogIntegrationEntity[]>;
  abstract findByTenantAndPlatform(
    tenantId: string,
    platform: PlatformType,
  ): Promise<CatalogIntegrationEntity | null>;
  abstract findExpiredTokens(): Promise<CatalogIntegrationEntity[]>;
}
