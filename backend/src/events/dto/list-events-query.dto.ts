import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, ArrayMaxSize, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by tag names (OR semantics). Pass multiple for multi-select. Max 10 tags.',
    example: ['Tech', 'Music'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @Transform(({ value }) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value ? [value] : undefined;
    return undefined;
  })
  tags?: string[];
}
