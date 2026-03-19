import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../database/entities/tag.entity';

export interface TagResponse {
  id: string;
  name: string;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  async findAll(): Promise<TagResponse[]> {
    const tags = await this.tagRepo.find({
      order: { name: 'ASC' },
    });
    return tags.map((t) => ({ id: t.id, name: t.name }));
  }
}
