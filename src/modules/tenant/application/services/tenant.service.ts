import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { EventBusService } from 'src/shared/infrastructure/events/event-bus.service';
import { CreateAuditLogEvent } from 'src/modules/logs/domain/events/create-audit-log.event';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly eventBus: EventBusService,
  ) {}

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

    this.eventBus.publishEvent(
      new CreateAuditLogEvent(
        'CREATE',
        'TENANTS',
        new Date(),
        createdTenant.id,
        '',
        {
          name: createdTenant.name,
          email: createdTenant.email,
          defaultLanguage: createdTenant.defaultLanguage,
          defaultCurrency: createdTenant.defaultCurrency,
          timezone: createdTenant.timezone,
          isActive: createdTenant.isActive,
          description: `Tenant ${createdTenant.name} created`,
        },
      ),
      'create-audit-log',
    );
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

    this.eventBus.publishEvent(
      new CreateAuditLogEvent(
        'UPDATE',
        'TENANTS',
        new Date(),
        updatedTenant.id,
        '',
        {
          description: `Tenant ${updatedTenant.name} updated`,
        },
      ),
      'create-audit-log',
    );
    return updatedTenant;
  }

  async activateTenant(id: string): Promise<TenantEntity> {
    const res = await this.updateTenant(id, { isActive: true });

    this.eventBus.publishEvent(
      new CreateAuditLogEvent('UPDATE', 'TENANTS', new Date(), res.id, '', {
        description: `Tenant ${res.name} activated`,
      }),
      'create-audit-log',
    );
    return res;
  }

  async deactivateTenant(id: string): Promise<TenantEntity> {
    const res = await this.updateTenant(id, { isActive: false });
    this.eventBus.publishEvent(
      new CreateAuditLogEvent('UPDATE', 'TENANTS', new Date(), res.id, '', {
        description: `Tenant ${res.name} deactivated`,
      }),
      'create-audit-log',
    );
    return res;
  }
}
