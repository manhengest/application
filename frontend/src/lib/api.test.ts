import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosHeaders } from 'axios';

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

  const getRequestFulfilled = () => {
    const handler = api.interceptors.request.handlers?.[0];
    if (!handler?.fulfilled) {
      throw new Error('Request interceptor handler is not registered');
    }
    return handler.fulfilled;
  };

  const getResponseRejected = () => {
    const handler = api.interceptors.response.handlers?.[0];
    if (!handler?.rejected) {
      throw new Error('Response interceptor handler is not registered');
    }
    return handler.rejected;
  };

  describe('request interceptor', () => {
    it('attaches Authorization header when token exists', async () => {
      mockToken = 'jwt-token-123';

      const requestFulfilled = getRequestFulfilled();
      const config = await requestFulfilled({
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
      });

      expect(config.headers.Authorization).toBe('Bearer jwt-token-123');
    });

    it('does not attach Authorization header when no token', async () => {
      mockToken = null;

      const requestFulfilled = getRequestFulfilled();
      const config = await requestFulfilled({
        headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
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

      const responseRejected = getResponseRejected();
      await expect(responseRejected(err)).rejects.toThrow();

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('does not call logout on non-401 errors', async () => {
      const err = Object.assign(new Error('Network Error'), {
        isAxiosError: true,
        response: { status: 500 },
      });

      const responseRejected = getResponseRejected();
      await expect(responseRejected(err)).rejects.toThrow();

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });
});
