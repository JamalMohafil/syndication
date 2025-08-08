import { BaseRepository } from '../../../../shared/domain/repositories/base.repository';
import { TenantEntity } from '../entities/tenant.entity';

export interface TenantRepository extends BaseRepository<TenantEntity> {
  findByEmail(email: string): Promise<TenantEntity | null>;
  findActiveTenantsOnly(): Promise<TenantEntity[]>;
}
