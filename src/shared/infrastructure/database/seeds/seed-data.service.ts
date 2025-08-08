import { Injectable, OnModuleInit } from '@nestjs/common';
import { TenantService } from 'src/modulus/tenant/application/services/tenant.service';

@Injectable()
export class SeedDataService implements OnModuleInit {
  constructor(private readonly tenantService: TenantService) {}

  async onModuleInit() {
    await this.seedTenants();
  }

  private async seedTenants() {
    try {
      // Check if demo tenants already exist
      const existingTenants = await this.tenantService.getAllTenants();
      if (existingTenants.length > 0) {
        console.log('🌱 Demo tenants already exist, skipping seeding');
        return;
      }

      console.log('🌱 Seeding demo tenants...');

      // Create demo tenants
      const demoTenants = [
        {
          name: 'Acme Electronics Store',
          email: 'admin@acme-electronics.demo',
          defaultLanguage: 'en',
          defaultCurrency: 'USD',
          timezone: 'America/New_York',
        },
        {
          name: 'Fashion Forward Boutique',
          email: 'owner@fashionforward.demo',
          defaultLanguage: 'en',
          defaultCurrency: 'EUR',
          timezone: 'Europe/London',
        },
        {
          name: 'Turkish Delights Store',
          email: 'contact@turkishdelights.demo',
          defaultLanguage: 'tr',
          defaultCurrency: 'TRY',
          timezone: 'Europe/Istanbul',
        },
        {
          name: 'Sports Gear Pro',
          email: 'info@sportsgear.demo',
          defaultLanguage: 'en',
          defaultCurrency: 'USD',
          timezone: 'America/Los_Angeles',
        },
      ];

      for (const tenantData of demoTenants) {
        await this.tenantService.createTenant(
          tenantData.name,
          tenantData.email,
          tenantData.defaultLanguage,
          tenantData.defaultCurrency,
          tenantData.timezone,
        );
      }

      console.log('✅ Demo tenants seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding demo tenants:', error.message);
    }
  }
}
