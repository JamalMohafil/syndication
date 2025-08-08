import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { TenantEntity } from '../entities/tenant.entity';

export abstract class TenantRepository extends BaseRepository<TenantEntity> {
  abstract findByEmail(email: string): Promise<TenantEntity | null>;
  abstract findActiveTenantsOnly(): Promise<TenantEntity[]>;
}
