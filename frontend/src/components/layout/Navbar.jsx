import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar({ onMenuClick, title, searchSlot }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface">
      <div className="flex h-full items-center gap-4 px-4 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-container-high lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {title && (
          <h1 className="hidden shrink-0 text-lg font-semibold text-text-primary lg:block">{title}</h1>
        )}

        <div className="flex-1">{searchSlot}</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-container-high hover:text-primary focus-ring"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-container-high hover:text-danger focus-ring"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
