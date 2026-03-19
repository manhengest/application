import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { extractErrorMessage, type AppError } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { ErrorAlert } from '../components/ui/ErrorAlert';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{
        user: { id: string; name: string; email: string };
        token: string;
      }>('/auth/register', { name, email, password });
      setAuth(data.user, data.token);
      void navigate('/events', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err as AppError, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign up</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} />}
        <FormField label="Name">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </FormField>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
