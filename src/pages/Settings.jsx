import React, { useRef } from 'react';
import { Settings as SettingsIcon, Database, Shield, Trash2, Download, Upload, CheckCircle2 } from 'lucide-react';
import { storage } from '../utils/storage';

const Settings = () => {
  const fileInputRef = useRef(null);

  const handleClearLogs = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all attendance logs? This action cannot be undone.'
      )
    ) {
      await storage.clearLogs();
      alert('Logs cleared successfully!');
    }
  };

  const handleExportData = async () => {
    try {
      const users = await storage.getUsers();
      const logs = await storage.getAttendanceLogs();
      const data = {
        users,
        logs,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Safe filename without Windows forbidden characters like /
      const safeDate = new Date().toISOString().slice(0, 10);
      link.download = `facepass_backup_${safeDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data backup.');
    }
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || (!parsed.users && !parsed.logs)) {
          alert('Invalid backup file format. Expected FacePass JSON format.');
          return;
        }

        let userCount = 0;
        let logCount = 0;

        if (Array.isArray(parsed.users)) {
          for (const user of parsed.users) {
            if (user.id && user.name && user.embeddings) {
              await storage.saveUser(user);
              userCount++;
            }
          }
        }

        if (Array.isArray(parsed.logs)) {
          for (const log of parsed.logs) {
            await storage.saveAttendance(log);
            logCount++;
          }
        }

        alert(`Restore completed! Restored ${userCount} users and ${logCount} attendance logs.`);
      } catch (err) {
        console.error('Restore error:', err);
        alert('Failed to restore data. Please make sure the JSON file is valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon size={32} className="text-primary-600" /> Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Configure system preferences and manage local storage backups.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Data Management */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Database size={20} className="text-primary-600" />
            <h2 className="text-xl font-bold">Data Management</h2>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleExportData}
              className="w-full btn-secondary flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Download size={18} />
                <span>Backup All Data</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors">
                JSON
              </span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreFile}
              accept=".json,application/json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Upload size={18} />
                <span>Restore from Backup</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors">
                Import
              </span>
            </button>

            <button
              onClick={handleClearLogs}
              className="w-full p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={18} />
                <span>Clear Attendance Logs</span>
              </div>
            </button>
          </div>
        </div>

        {/* System & Privacy */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={20} className="text-primary-600" />
            <h2 className="text-xl font-bold">System & Privacy</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-bold">Offline Biometrics</p>
                <p className="text-xs text-slate-500">All recognition is done 100% locally</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={14} /> ACTIVE
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <p className="font-bold">Camera Resolution</p>
                <p className="text-xs text-slate-500">Default: 640x480 (SD Optimized)</p>
              </div>
              <span className="text-xs font-bold text-primary-600">LOCKED</span>
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-xs border border-primary-100 dark:border-primary-900/30 leading-relaxed">
              <p className="font-bold mb-1">Privacy Notice</p>
              Face embeddings are stored as mathematical vectors (128-float arrays). No photos or video recordings are saved on any server or disk.
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 opacity-30">
        <p className="text-sm font-bold">FacePass v1.0.0-Phase2</p>
        <p className="text-xs">Built with React + face-api.js</p>
      </footer>
    </div>
  );
};

export default Settings;
