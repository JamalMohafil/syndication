import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogVertical } from '../enums/catalog-vertical.enum';

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
}
