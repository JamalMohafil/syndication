import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductFeedRepository } from '../../domain/repositories/product-feed.repository';
import { ProductFeedEntity } from '../../domain/entities/product-feed.entity';
import { ProductFeedDocument, ProductFeedName } from '../schemas/product-feed.schema';
import { FeedStatus } from '../../domain/enums/feed-status.enum';

@Injectable()
export class ProductFeedMongoRepository extends ProductFeedRepository {
  constructor(
    @InjectModel(ProductFeedName)
    private readonly productFeedModel: Model<ProductFeedDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<ProductFeedEntity | null> {
    const feed = await this.productFeedModel.findById(id).exec();
    return feed ? this.toDomainEntity(feed) : null;
  }

  async findByTenantId(tenantId: string): Promise<ProductFeedEntity[]> {
    const feeds = await this.productFeedModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();
    return feeds.map((feed) => this.toDomainEntity(feed));
  }

  async findByStatus(status: FeedStatus): Promise<ProductFeedEntity[]> {
    const feeds = await this.productFeedModel.find({ status }).exec();
    return feeds.map((feed) => this.toDomainEntity(feed));
  }

  async findPendingFeeds(): Promise<ProductFeedEntity[]> {
    return await this.findByStatus(FeedStatus.PENDING);
  }

  async findAll(): Promise<ProductFeedEntity[]> {
    const feeds = await this.productFeedModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    return feeds.map((feed) => this.toDomainEntity(feed));
  }

  async create(entity: ProductFeedEntity): Promise<ProductFeedEntity> {
    const createdFeed = new this.productFeedModel({
      tenantId: entity.tenantId,
      fileUrl: entity.fileUrl,
      fileName: entity.fileName,
      fileType: entity.fileType,
      fileSize: entity.fileSize,
      totalProducts: entity.totalProducts,
      status: entity.status,
      createdBy: entity.createdBy,
      errorMessage: entity.errorMessage,
    });

    const savedFeed = await createdFeed.save();
    return this.toDomainEntity(savedFeed);
  }

  async update(
    id: string,
    updates: Partial<ProductFeedEntity>,
  ): Promise<ProductFeedEntity | null> {
    const updatedFeed = await this.productFeedModel
      .findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true },
      )
      .exec();

    return updatedFeed ? this.toDomainEntity(updatedFeed) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productFeedModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  private toDomainEntity(document: ProductFeedDocument): ProductFeedEntity {
    console.log(document, 'document');
    return new ProductFeedEntity({
      id: document.id.toString(),
      tenantId: document.tenantId,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      totalProducts: document.totalProducts,
      status: document.status,
      createdBy: document.createdBy,
      errorMessage: document.errorMessage,
    });
  }
}
