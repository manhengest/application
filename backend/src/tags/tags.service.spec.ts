import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';
import { TagsService } from './tags.service';
import { Tag } from '../database/entities/tag.entity';

describe('TagsService', () => {
  let service: TagsService;
  let tagRepo: jest.Mocked<Repository<Tag>>;

  const mockTags = [
    { id: 'tag-1', name: 'Art', normalizedName: 'art', events: [] },
    { id: 'tag-2', name: 'Business', normalizedName: 'business', events: [] },
    { id: 'tag-3', name: 'Tech', normalizedName: 'tech', events: [] },
  ];

  beforeEach(async () => {
    const mockTagRepo = {
      find: jest.fn().mockResolvedValue([...mockTags]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
    tagRepo = module.get(getRepositoryToken(Tag));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return tags ordered by name', async () => {
      const result = await service.findAll();

      expect(tagRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
      expect(result).toEqual([
        { id: 'tag-1', name: 'Art' },
        { id: 'tag-2', name: 'Business' },
        { id: 'tag-3', name: 'Tech' },
      ]);
    });

    it('should map to TagResponse shape (id and name only)', async () => {
      const result = await service.findAll();

      result.forEach((tag) => {
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(Object.keys(tag)).toHaveLength(2);
      });
    });
  });
});
