import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { TagsService, TagResponse } from './tags.service';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private tags: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all tags' })
  @ApiResponse({ status: 200, description: 'List of tags ordered by name' })
  list(): Promise<TagResponse[]> {
    return this.tags.findAll();
  }
}
