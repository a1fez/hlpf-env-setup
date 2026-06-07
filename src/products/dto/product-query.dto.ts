import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Номер сторінки', default: 1 })
  @IsOptional()
  @Type(() => Number) // Конвертує рядок з URL в число
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Елементів на сторінці', default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ example: 'price', enum: ['name', 'price', 'stock', 'createdAt'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['name', 'price', 'stock', 'createdAt'])
  sort?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 1, description: 'ID категорії' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ example: 100, description: 'Мін. ціна' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Макс. ціна' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'iPhone', description: 'Пошук за назвою' })
  @IsOptional()
  @IsString()
  search?: string;
}