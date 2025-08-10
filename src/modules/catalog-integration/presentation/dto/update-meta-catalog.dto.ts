import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogVertical } from '../enums/catalog-vertical.enum';

export class UpdateMetaCatalogDto {
  @ApiPropertyOptional({ description: 'Name of the catalog' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: CatalogVertical,
    description: 'Vertical category of the catalog',
  })
  @IsOptional()
  @IsEnum(CatalogVertical)
  vertical?: CatalogVertical;

}
