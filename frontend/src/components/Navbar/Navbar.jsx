import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Search, QrCode, Globe, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  
  // Get initial from email
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="flex justify-end items-center w-full px-md h-16 sticky top-0 z-50 bg-surface-bright shadow-sm">
      <div className="flex items-center lg:hidden">
        <h2 className="title-md text-primary">Krishi Setu</h2>
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm pl-sm">
          <div className="flex items-center gap-sm transition-opacity border-none bg-transparent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
              {initial}
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="label-sm text-on-surface">{user?.email.split('@')[0]}</span>
            </div>
          </div>
          <button onClick={logout} className="w-10 h-10 ml-2 rounded-full hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
