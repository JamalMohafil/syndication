import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantDocument, TenantDocumentName } from '../schemas/tenant.schema';

@Injectable()
export class MongoTenantRepository extends TenantRepository {
  constructor(
    @InjectModel(TenantDocumentName)
    private readonly tenantModel: Model<TenantDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await this.tenantModel.findById(id).exec();
 
    return tenant ? this.toDomainEntity(tenant) : null;
  }

  async findByEmail(email: string): Promise<TenantEntity | null> {
    const tenant = await this.tenantModel.findOne({ email }).exec();
    return tenant ? this.toDomainEntity(tenant) : null;
  }

  async findAll(): Promise<TenantEntity[]> {
    const tenants = await this.tenantModel.find().exec();
    return tenants.map((tenant) => this.toDomainEntity(tenant));
  }

  async findActiveTenantsOnly(): Promise<TenantEntity[]> {
    const tenants = await this.tenantModel.find({ isActive: true }).exec();
    return tenants.map((tenant) => this.toDomainEntity(tenant));
  }

  async create(entity: TenantEntity): Promise<TenantEntity> {
    const createdTenant = new this.tenantModel({
      name: entity.name,
      email: entity.email,
      defaultLanguage: entity.defaultLanguage,
      defaultCurrency: entity.defaultCurrency,
      timezone: entity.timezone,
      isActive: entity.isActive,
    });

    const savedTenant = await createdTenant.save();
     return this.toDomainEntity(savedTenant);
  }

  async update(
    id: string,
    updates: Partial<TenantEntity>,
  ): Promise<TenantEntity | null> {
    const updatedTenant = await this.tenantModel
      .findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    return updatedTenant ? this.toDomainEntity(updatedTenant) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.tenantModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private toDomainEntity(document: TenantDocument): TenantEntity {
     return new TenantEntity(
      {
        name: document.name,
        email: document.email,
        defaultLanguage: document.defaultLanguage,
        defaultCurrency: document.defaultCurrency,
        timezone: document.timezone,
        isActive: document.isActive,
      },
      String(document._id),
      // document.toObject().createdAt,
      // document.updatedAt,
    );
  }
}
