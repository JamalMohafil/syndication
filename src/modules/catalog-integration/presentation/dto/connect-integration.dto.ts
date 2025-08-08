import { ApiProperty } from "@nestjs/swagger";
import { PlatformType } from "../../domain/enums/platform-type.enum";

export class ConnectIntegrationDto {
  @ApiProperty({
    description: 'Authorization code from OAuth flow',
    example: '4/0AX4XfWi...',
  })
  authCode: string;

  @ApiProperty({
    description: 'Platform type',
    enum: PlatformType,
    example: PlatformType.GOOGLE,
  })
  platform: PlatformType;
}