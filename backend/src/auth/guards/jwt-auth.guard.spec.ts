import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createMockContext = (overrides?: Partial<ExecutionContext>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
      ...overrides,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access when route is public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return undefined;
    });
    const ctx = createMockContext();
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should allow access when optional auth and no token (fallback to true)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === OPTIONAL_AUTH_KEY) return true;
      return undefined;
    });
    const ctx = createMockContext();
    const superCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate',
    );
    superCanActivate.mockRejectedValueOnce(new Error('No token'));
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should delegate to parent when not public and not optional', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = createMockContext();
    const superCanActivate = jest.spyOn(
      Object.getPrototypeOf(JwtAuthGuard.prototype),
      'canActivate',
    );
    superCanActivate.mockResolvedValue(true);
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
