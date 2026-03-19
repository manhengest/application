import { Test, type TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

describe('TagsController', () => {
  let controller: TagsController;

  const mockTagsService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 'tag-1', name: 'Tech' },
      { id: 'tag-2', name: 'Art' },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        {
          provide: TagsService,
          useValue: mockTagsService,
        },
      ],
    }).compile();

    controller = module.get<TagsController>(TagsController);
    mockTagsService.findAll.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should return tags from service', async () => {
      const result = await controller.list();

      expect(mockTagsService.findAll).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 'tag-1', name: 'Tech' },
        { id: 'tag-2', name: 'Art' },
      ]);
    });
  });
});
