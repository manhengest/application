import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../database/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: 'id' | 'name' | 'email' | undefined, ctx: ExecutionContext): User | string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User | null;
    if (!user) return null;
    return data ? (user[data] as string) : user;
  },
);
