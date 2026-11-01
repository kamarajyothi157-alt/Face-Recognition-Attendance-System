import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  UserPlus, 
  Camera, 
  History, 
  Sun, 
  Moon,
  ShieldCheck,
  Users,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/users', icon: Users, label: 'Manage Users' },
    { to: '/register', icon: UserPlus, label: 'Register Face' },
    { to: '/attendance', icon: Camera, label: 'Mark Attendance' },
    { to: '/records', icon: History, label: 'Records' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 hidden lg:flex flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FacePass</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <button 
          onClick={() => setIsDark(!isDark)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
          <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary-600" />
            <span className="font-bold">FacePass</span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Mobile Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
          {navItems.map((item) => (
            <Link 
              key={item.to}
              to={item.to}
              className={`p-2 rounded-xl ${location.pathname === item.to ? 'text-primary-600' : 'text-slate-400'}`}
            >
              <item.icon size={24} />
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
