import { ApiProperty } from "@nestjs/swagger";
import { PlatformType } from "../../domain/enums/platform-type.enum";

export class PlatformStatusDto {
  @ApiProperty({
    description: 'Platform name',
    enum: PlatformType,
    example: PlatformType.GOOGLE,
  })
  platform: PlatformType;

  @ApiProperty({
    description: 'Connection status',
    example: true,
  })
  connected: boolean;

  @ApiProperty({
    description: 'Integration status',
    example: 'CONNECTED',
  })
  status: string;

  @ApiProperty({
    description: 'Token expiry status',
    example: false,
  })
  tokenExpired: boolean;

  @ApiProperty({
    description: 'Last sync timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  lastSync?: Date;
}
