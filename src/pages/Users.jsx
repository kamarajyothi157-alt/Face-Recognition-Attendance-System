import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Trash2, UserPlus, Search, ShieldAlert, BadgeCheck, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await storage.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleDelete = async (userId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this user? All their attendance records will remain, but their face will no longer be recognized.'
      )
    ) {
      try {
        await storage.deleteUser(userId);
        await fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user.');
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400">
            View, search, and manage registered facial profiles in the system.
          </p>
        </div>
        <Link to="/register" className="btn-primary flex items-center gap-2">
          <UserPlus size={18} /> Register New Face
        </Link>
      </header>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search registered users by name or ID..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="glass-card p-6 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center">
                  <UsersIcon size={24} />
                </div>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                  {user.name}
                  <BadgeCheck size={18} className="text-primary-500" />
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{user.id}</p>
                {user.registeredAt && (
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Registered: {new Date(user.registeredAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Face Embeddings: <span className="text-emerald-500 font-bold uppercase">128-D Vector</span>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50" />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-card">
            <ShieldAlert size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold mb-2">No Users Found</h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ? 'No users matched your search criteria.' : 'Start by registering your first face in the system.'}
            </p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2">
              <UserPlus size={18} /> Register Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
