import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface JwtPayload {
  exp?: number;
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const raw = JSON.parse(atob(token.split('.')[1] ?? '{}')) as JwtPayload | null;
    if (!raw) return null;
    const { exp } = raw;
    return { exp: typeof exp === 'number' ? exp : undefined };
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  return !payload.exp || payload.exp * 1000 <= Date.now();
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuthStore();
  const location = useLocation();

  if (!user || isTokenExpired(token)) {
    if (user && isTokenExpired(token)) {
      logout();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
