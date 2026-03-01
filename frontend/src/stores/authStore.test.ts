import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types';

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null });
  });

  it('has initial state with user and token null', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('setAuth updates user and token', () => {
    useAuthStore.getState().setAuth(mockUser, 'jwt-token');

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe('jwt-token');
  });

  it('logout resets user and token to null', () => {
    useAuthStore.getState().setAuth(mockUser, 'jwt-token');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('persists user and token to localStorage under auth key', () => {
    useAuthStore.getState().setAuth(mockUser, 'jwt-token');

    const stored = localStorage.getItem('auth');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state).toMatchObject({ user: mockUser, token: 'jwt-token' });
  });
});
