import { ApiProperty } from '@nestjs/swagger';
import { PlatformStatusDto } from './platform-status.dto';

export class IntegrationSummaryDto {
  @ApiProperty({
    description: 'Total number of integrations',
    example: 3,
  })
  totalIntegrations: number;

  @ApiProperty({
    description: 'Number of active integrations',
    example: 2,
  })
  activeIntegrations: number;

  @ApiProperty({
    description: 'Platform connection status',
    type: [PlatformStatusDto],
  })
  platforms: PlatformStatusDto[];

  @ApiProperty({
    description: 'Next token refresh date',
    example: '2024-02-15T10:30:00Z',
    required: false,
  })
  nextTokenRefresh?: Date;
}
