import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';

@Injectable()
export class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async createTenant(
    name: string,
    email: string,
    defaultLanguage: string = 'en',
    defaultCurrency: string = 'USD',
    timezone: string = 'UTC',
  ): Promise<TenantEntity> {
    const existingTenant = await this.tenantRepository.findByEmail(email);
    if (existingTenant) {
      throw new BadRequestDomainException(
        'Tenant with this email already exists',
      );
    }

    const tenant = new TenantEntity({
      name,
      email,
      defaultLanguage,
      defaultCurrency,
      timezone,
      isActive: true,
    });
    const createdTenant = await this.tenantRepository.create(tenant);
    console.log(createdTenant);
    return createdTenant;
  }

  async getTenantById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundDomainException(`Tenant ${id} not found`);
    }
    return tenant;
  }

  async getAllTenants(): Promise<TenantEntity[]> {
    return await this.tenantRepository.findAll();
  }

  async updateTenant(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      defaultLanguage: string;
      defaultCurrency: string;
      timezone: string;
      isActive: boolean;
    }>,
  ): Promise<TenantEntity> {
    const tenant = await this.getTenantById(id);
    const updatedTenant = await this.tenantRepository.update(id, updates);

    if (!updatedTenant) {
      throw new NotFoundDomainException(`Tenant ${id} not found`);
    }

    return updatedTenant;
  }

  async activateTenant(id: string): Promise<TenantEntity> {
    return await this.updateTenant(id, { isActive: true });
  }

  async deactivateTenant(id: string): Promise<TenantEntity> {
    return await this.updateTenant(id, { isActive: false });
  }
}
