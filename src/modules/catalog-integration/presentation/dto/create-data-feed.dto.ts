import { ApiProperty } from '@nestjs/swagger';

export class CreateDataFeedDto {
  @ApiProperty({
    description: 'Feed name',
    example: 'My Product Feed',
  })
  feedName: string;

  @ApiProperty({
    description: 'Feed URL endpoint',
    example: 'https://yourstore.com/api/v1/feeds/google-feed-123.xml',
  })
  feedUrl: string;
}
