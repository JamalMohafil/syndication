import { Injectable } from '@nestjs/common';
import { PlatformType } from 'src/modules/catalog-integration/domain/enums/platform-type.enum';
import { PlatformStatusDto } from 'src/modules/catalog-integration/presentation/dto/platform-status.dto';
import { CatalogIntegrationService } from '../../services/catalog-integration.service';

interface GetIntegrationSummaryRequest {
  tenantId: string;
}
@Injectable()
export class GetIntegrationSummaryUseCase {
  constructor(
    private readonly catalogIntegrationService: CatalogIntegrationService,
  ) {}
  async execute(request: GetIntegrationSummaryRequest) {
    const tenantId = request.tenantId;
    const integrations =
      await this.catalogIntegrationService.getTenantIntegrations(tenantId);

    const platforms: PlatformStatusDto[] = Object.values(PlatformType).map(
      (platform) => {
        const integration = integrations.find(
          (int) => int.platform === platform,
        );
        return {
          platform: platform as PlatformType,
          connected: !!integration,
          status: integration?.status || 'NOT_CONNECTED',
          tokenExpired: integration?.isTokenExpired() || false,
          lastSync: integration?.updatedAt,
        };
      },
    );

    const nextTokenRefresh = integrations
      .filter((int) => int.tokenExpiresAt)
      .sort(
        (a, b) =>
          (a.tokenExpiresAt?.getTime() || 0) -
          (b.tokenExpiresAt?.getTime() || 0),
      )[0]?.tokenExpiresAt;

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(
        (int) => int.status === 'CONNECTED',
      ).length,
      platforms,
      nextTokenRefresh,
    };
  }
}
