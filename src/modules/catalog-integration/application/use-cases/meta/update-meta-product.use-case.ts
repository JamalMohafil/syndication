import { Injectable } from '@nestjs/common';
import { MetaCatalogService } from 'src/modules/catalog-integration/infrastructure/external-services/meta/meta-catalog.service';
import { CreateProductDto } from 'src/modules/catalog-integration/presentation/dto/create-meta-product.dto';
import { GetMetaIntegrationUseCase } from './get-meta-integration.use-case';
import { BadRequestDomainException } from 'src/shared/domain/exceptions/bad-request-domain.exception';
import { NotFoundDomainException } from 'src/shared/domain/exceptions/not-found-domain.exception';

@Injectable()
export class UpdateMetaProductUseCase {
  constructor(
    private readonly metaCatalogService: MetaCatalogService,
    private readonly getMetaIntegrationUseCase: GetMetaIntegrationUseCase,
  ) {}

  async execute(
    productId: string,
    tenantId: string,
    productData: Partial<CreateProductDto>,
  ) {
    const integration = await this.getMetaIntegrationUseCase.execute({
      tenantId,
    });

    if (!integration || !integration.isActive()) {
      throw new BadRequestDomainException('Meta integration is not active');
    }

    const existing =
      await this.metaCatalogService.checkProductExistsByProductId(
        productId,
        integration.accessToken,
      );

    if (!existing.exists) {
      throw new NotFoundDomainException(`Product not found`);
    }

    return await this.metaCatalogService.updateProduct(
      productId,
      productData,
      integration.accessToken,
    );
  }
}
