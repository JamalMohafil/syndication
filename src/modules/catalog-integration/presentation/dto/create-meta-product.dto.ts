import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode } from '../enums/currency-code.enum';

export enum Availability {
  IN_STOCK = 'in stock',
  OUT_OF_STOCK = 'out of stock',
  PREORDER = 'preorder',
  AVAILABLE_FOR_ORDER = 'available for order',
  DISCONTINUED = 'discontinued',
}

export enum Condition {
  NEW = 'new',
  REFURBISHED = 'refurbished',
  USED = 'used',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Retailer product ID' })
  @IsString()
  retailer_id: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({
    enum: Availability,
    description: 'Product availability status',
  })
  @IsEnum(Availability)
  availability: Availability;

  @ApiProperty({ enum: Condition, description: 'Product condition' })
  @IsEnum(Condition)
  condition: Condition;

  @ApiProperty({ description: 'Price (رقم بدون العملة)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Currency code (رمز العملة ISO 4217)',
    enum: CurrencyCode,
  })
  @IsEnum(CurrencyCode, {
    message:
      'currency must be a valid ISO 4217 currency code supported by Facebook Payments',
  })
  currency: CurrencyCode;

  @ApiProperty({ description: 'Product URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ description: 'Main image URL' })
  @IsUrl()
  image_url: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Category name' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Additional image URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  additional_image_urls?: string[];

  @ApiPropertyOptional({ description: 'Custom additional data', type: Object })
  @IsOptional()
  @IsObject()
  custom_data?: Record<string, any>;
}
