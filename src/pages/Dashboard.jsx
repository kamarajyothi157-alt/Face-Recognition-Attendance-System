import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ClipboardCheck, ArrowRight, UserPlus, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card p-6 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  </div>
);

const QuickAction = ({ to, title, description, icon: Icon, color }) => (
  <Link to={to} className="group glass-card p-6 hover:border-primary-500/50 transition-all duration-300">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform ${color}`}>
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{description}</p>
    <div className="flex items-center text-primary-600 font-semibold gap-2 group-hover:gap-3 transition-all">
      Get Started <ArrowRight size={18} />
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, attendance: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const users = await storage.getUsers();
      const logs = await storage.getAttendanceLogs();
      setStats({
        users: users.length,
        attendance: logs.length
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your face recognition attendance system with ease.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Registered Users" 
          value={stats.users} 
          icon={Users} 
          color="bg-blue-600 shadow-blue-500/30" 
        />
        <StatCard 
          title="Total Attendance Records" 
          value={stats.attendance} 
          icon={ClipboardCheck} 
          color="bg-emerald-600 shadow-emerald-500/30" 
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickAction 
            to="/register"
            title="Register New Face"
            description="Add a new user by capturing their face embeddings for future recognition."
            icon={UserPlus}
            color="bg-primary-600 shadow-primary-500/30"
          />
          <QuickAction 
            to="/attendance"
            title="Mark Attendance"
            description="Launch the real-time recognition module to mark attendance automatically."
            icon={Camera}
            color="bg-purple-600 shadow-purple-500/30"
          />
        </div>
      </section>

      <section className="glass-card p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-3">System Ready</h2>
          <p className="text-primary-100 max-w-lg mb-6">
            All models are loaded locally and storage is initialized. You can work entirely offline.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs backdrop-blur-md">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Camera Connected
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs backdrop-blur-md">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Storage Active
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </section>
    </div>
  );
};

export default Dashboard;
