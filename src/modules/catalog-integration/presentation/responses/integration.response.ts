import { ApiProperty } from '@nestjs/swagger';
import { PlatformType } from '../../domain/enums/platform-type.enum';

export class IntegrationResponseDto {
  @ApiProperty({
    description: 'Integration ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({ description: 'Tenant ID', example: 'tenant_123' })
  tenantId: string;

  @ApiProperty({
    description: 'Platform type',
    enum: PlatformType,
    example: PlatformType.GOOGLE,
  })
  platform: PlatformType;

  @ApiProperty({ description: 'External platform ID', example: '12345678' })
  externalId?: string;

  @ApiProperty({
    description: 'Integration status',
    example: 'CONNECTED',
  })
  status: string;

  @ApiProperty({
    description: 'Token expiration date',
    example: '2024-12-31T23:59:59.000Z',
  })
  tokenExpiresAt?: Date;

  @ApiProperty({
    description: 'Platform-specific configurations',
    type: 'object',
    example: { merchantId: '12345678', accountName: 'My Store' },
    additionalProperties: true,
  })
  platformConfigs?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
