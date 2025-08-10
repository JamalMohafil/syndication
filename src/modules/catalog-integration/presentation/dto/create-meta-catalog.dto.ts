import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CatalogVertical {
  COMMERCE = 'commerce',
  HOTELS = 'hotels',
  FLIGHTS = 'flights',
  DESTINATIONS = 'destinations',
  HOME_LISTINGS = 'home_listings',
  VEHICLES = 'vehicles',
  MEDIA = 'media',
}

export class CreateMetaCatalogDto {
  @ApiProperty({ description: 'Name of the catalog' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Business ID owning the catalog' })
  @IsString()
  business_id: string;

  @ApiPropertyOptional({
    enum: CatalogVertical,
    description: 'Vertical category of the catalog',
  })
  @IsOptional()
  @IsEnum(CatalogVertical)
  vertical?: CatalogVertical;

  @ApiPropertyOptional({ description: 'Limit of feeds', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  feed_count_limit?: number;

  @ApiPropertyOptional({ description: 'Limit of items', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  item_count_limit?: number;
}
