import React from 'react';
import { Search, QrCode, Globe, Bell } from 'lucide-react';

const Navbar = () => {
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
          <button className="flex items-center gap-sm hover:opacity-80 transition-opacity border-none bg-transparent cursor-pointer">
            <img className="w-8 h-8 rounded-full object-cover" alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX9-sOD0ZzY_uNPLnq2xjEV36EBePvtLDqtbsTTjRPjp80WwzUaBmivLWRWkAJYy6nt5akmO3y8PSsa9jvtozYAHtK1xzcJQeCsSubu1d3Jl16HNrJmX91F_7Ra8qWPvSecJznoDflChr4JQczUET8Uhw2b00cUTtlCKubZWEJWVVtbbtwN7786NFcmhKT1KH8vW7XkVNYLInK2KHIASAAaQjuctsmMTBS02pG4QQlCG4Rfj8liDkIfw" />
            <span className="label-sm hidden md:block text-on-surface">Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
