import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed',
    createdAt: new Date(),
    organizedEvents: [],
    participations: [],
  };

  beforeEach(async () => {
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException when email already registered', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password, save user, and return user + token without passwordHash', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      (userRepo.create as jest.Mock).mockReturnValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepo.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      expect(userRepo.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toMatchObject({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(result.token).toBe('jwt-token');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return user + token without passwordHash on correct credentials', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toMatchObject({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      });
      expect(result.token).toBe('jwt-token');
    });
  });
});
