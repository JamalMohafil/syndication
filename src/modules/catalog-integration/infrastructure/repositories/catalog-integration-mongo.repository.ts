import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogIntegrationRepository } from '../../domain/repositories/catalog-integration.repository';
import { CatalogIntegrationEntity } from '../../domain/entities/catalog-integration.entity';
import { CatalogIntegrationDocument, CatalogIntegrationName } from '../schemas/catalog-integration.schema';
import { PlatformType } from '../../domain/enums/platform-type.enum';

@Injectable()
export class CatalogIntegrationMongoRepository extends CatalogIntegrationRepository {
  constructor(
    @InjectModel(CatalogIntegrationName)
    private readonly catalogIntegrationModel: Model<CatalogIntegrationDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<CatalogIntegrationEntity | null> {
    const integration = await this.catalogIntegrationModel.findById(id).exec();
    return integration ? this.toDomainEntity(integration) : null;
  }

  async findByTenantId(tenantId: string): Promise<CatalogIntegrationEntity[]> {
    const integrations = await this.catalogIntegrationModel
      .find({ tenantId })
      .exec();
    return integrations.map((integration) => this.toDomainEntity(integration));
  }

  async findByTenantAndPlatform(
    tenantId: string,
    platform: PlatformType,
  ): Promise<CatalogIntegrationEntity | null> {
    const integration = await this.catalogIntegrationModel
      .findOne({ tenantId, platform })
      .exec();
    return integration ? this.toDomainEntity(integration) : null;
  }

  async findExpiredTokens(): Promise<CatalogIntegrationEntity[]> {
    const now = new Date();
    const integrations = await this.catalogIntegrationModel
      .find({
        tokenExpiresAt: { $lt: now },
      })
      .exec();
    return integrations.map((integration) => this.toDomainEntity(integration));
  }

  async findAll(): Promise<CatalogIntegrationEntity[]> {
    const integrations = await this.catalogIntegrationModel.find().exec();
    return integrations.map((integration) => this.toDomainEntity(integration));
  }

  async create(
    entity: CatalogIntegrationEntity,
  ): Promise<CatalogIntegrationEntity> {
    const createdIntegration = new this.catalogIntegrationModel({
      tenantId: entity.tenantId,
      platform: entity.platform,
      accessToken: entity.accessToken,
      refreshToken: entity.refreshToken,
      tokenExpiresAt: entity.tokenExpiresAt,
      externalId: entity.externalId,
      platformConfigs: entity.platformConfigs,
      status: entity.status,
    });

    const savedIntegration = await createdIntegration.save();
    return this.toDomainEntity(savedIntegration);
  }

  async update(
    id: string,
    updates: Partial<CatalogIntegrationEntity>,
  ): Promise<CatalogIntegrationEntity | null> {
    const updatedIntegration = await this.catalogIntegrationModel
      .findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    return updatedIntegration ? this.toDomainEntity(updatedIntegration) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.catalogIntegrationModel
      .findByIdAndDelete(id)
      .exec();
    return !!result;
  }

  private toDomainEntity(
    document: CatalogIntegrationDocument,
  ): CatalogIntegrationEntity {
    return new CatalogIntegrationEntity({
      id: document.id.toString(),
      tenantId: document.tenantId,
      platform: document.platform,
      accessToken: document.accessToken,
      refreshToken: document.refreshToken,
      tokenExpiresAt: document.tokenExpiresAt,
      externalId: document.externalId,
      platformConfigs: document.platformConfigs,
      status: document.status,
    });
  }
}
