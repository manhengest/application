import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Conference 2025' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'Annual technology conference...' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ example: '2025-11-15T09:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Convention Center, San Francisco' })
  @IsString()
  @MinLength(1)
  location: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @ApiProperty({ enum: ['public', 'private'] })
  @IsIn(['public', 'private'])
  visibility: 'public' | 'private';
}
