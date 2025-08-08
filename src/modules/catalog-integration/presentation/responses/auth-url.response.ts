import { ApiProperty } from '@nestjs/swagger';
import { PlatformType } from '../../domain/enums/platform-type.enum';

export class AuthUrlResponseDto {
  @ApiProperty({
    description: 'OAuth authorization URL',
    example: 'https://accounts.google.com/oauth2/auth?client_id=...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'Platform type',
    enum: PlatformType,
  })
  platform: PlatformType;

  @ApiProperty({
    description: 'Required scopes for the platform',
    type: [String],
    example: ['https://www.googleapis.com/auth/content'],
  })
  scopes: string[];
}
