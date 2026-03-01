import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { List, Calendar, LogOut, User } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1370px] mx-auto px-[15px]">
          <div className="flex justify-between items-center h-16">
            <div></div>
            <div className="flex items-center gap-6">
              <Link to="/events" className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                <List className="w-5 h-5 mr-2" />
                Events
              </Link>
              {user ? (
                <>
                  <Link to="/my-events" className="flex items-center text-gray-700 hover:text-gray-900 font-medium">
                    <Calendar className="w-5 h-5 mr-2" />
                    My Events
                  </Link>
                  <Link
                    to="/events/create"
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 font-medium"
                  >
                    + Create Event
                  </Link>
                  
                  <div className="w-px h-8 bg-gray-200"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}</span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-gray-700 ml-2"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-[1370px] mx-auto px-[15px] py-8">{children}</main>
    </div>
  );
}
