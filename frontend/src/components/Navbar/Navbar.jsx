import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Search, QrCode, Globe, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  
  // Get initial from email
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="flex justify-between items-center w-full px-md h-16 sticky top-0 z-50 bg-surface-bright shadow-sm">
      <div className="flex items-center lg:hidden">
        <h2 className="title-md text-primary">AgriExpert AI</h2>
      </div>
      <div className="hidden lg:flex items-center gap-sm bg-surface-container-low px-sm py-xs rounded-full border border-outline-variant w-96">
        <Search className="text-outline w-5 h-5" />
        <input className="bg-transparent border-none outline-none focus:ring-0 body-md text-on-surface-variant w-full placeholder-outline" placeholder="Search fields, crops, or insights..." type="text" />
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm">
          <button className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors border-none bg-transparent cursor-pointer">
            <QrCode className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors border-none bg-transparent cursor-pointer">
            <Globe className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors relative border-none bg-transparent cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
        </div>
        <div className="flex items-center gap-sm pl-sm border-l border-outline-variant">
          <div className="flex items-center gap-sm transition-opacity border-none bg-transparent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
              {initial}
            </div>
            <div className="hidden md:flex flex-col items-start">
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
