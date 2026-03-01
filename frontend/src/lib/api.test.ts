import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

let mockToken: string | null = null;
const mockLogout = vi.fn();

vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: mockToken, logout: mockLogout }),
  },
}));

const { api } = await import('./api');

describe('api interceptors', () => {
  beforeEach(() => {
    mockToken = null;
    mockLogout.mockClear();
  });

  describe('request interceptor', () => {
    it('attaches Authorization header when token exists', async () => {
      mockToken = 'jwt-token-123';

      const requestHandler = api.interceptors.request.handlers[0];
      const config = await requestHandler.fulfilled({
        headers: { 'Content-Type': 'application/json' },
      });

      expect(config.headers.Authorization).toBe('Bearer jwt-token-123');
    });

    it('does not attach Authorization header when no token', async () => {
      mockToken = null;

      const requestHandler = api.interceptors.request.handlers[0];
      const config = await requestHandler.fulfilled({
        headers: { 'Content-Type': 'application/json' },
      });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('calls logout on 401 response', async () => {
      const err = Object.assign(new Error('Unauthorized'), {
        isAxiosError: true,
        response: { status: 401 },
      });

      const responseHandler = api.interceptors.response.handlers[0];
      await expect(responseHandler.rejected(err)).rejects.toThrow();

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('does not call logout on non-401 errors', async () => {
      const err = Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        response: { status: 500 },
      });

      const responseHandler = api.interceptors.response.handlers[0];
      await expect(responseHandler.rejected(err)).rejects.toThrow();

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });
});
