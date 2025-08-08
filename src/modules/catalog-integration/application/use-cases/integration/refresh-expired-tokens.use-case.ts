import { Injectable } from '@nestjs/common';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';

@Injectable()
export class RefreshExpiredTokensUseCase {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
  ) {}
  async execute() {
    await this.catalogIntegrationService.refreshExpiredTokens();

    return { message: 'Token refresh completed', status: 200, success: true };
  }
}
