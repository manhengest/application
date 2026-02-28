import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });
    await this.userRepo.save(user);
    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  private signToken(user: User): string {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private sanitize(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
