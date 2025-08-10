import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDataFeedDto {
  @ApiProperty({
    description: 'Feed name',
    example: 'My Product Feed',
  })
  @IsString()
  feedName: string;

  @ApiProperty({
    description: 'Feed URL endpoint',
    example: 'https://yourstore.com/api/v1/feeds/google-feed-123.xml',
  })
  @IsString()
  feedUrl: string;
}
