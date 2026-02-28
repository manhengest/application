import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '{}'));
    return !payload?.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
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
