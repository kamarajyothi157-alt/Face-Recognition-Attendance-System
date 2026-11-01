/**
 * Utility for handling IndexedDB operations
 */

const DB_NAME = 'AttendanceSystemDB';
const DB_VERSION = 1;
const STORES = {
  USERS: 'users',
  LOGS: 'logs',
};

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        db.createObjectStore(STORES.LOGS, { keyPath: 'timestamp' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open database'));
  });
};

export const storage = {
  // Save user data
  saveUser: async (user) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USERS, 'readwrite');
      const store = tx.objectStore(STORES.USERS);
      store.put(user);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Failed to save user'));
    });
  },

  // Get all registered users
  getUsers: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USERS, 'readonly');
      const store = tx.objectStore(STORES.USERS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Failed to retrieve users'));
    });
  },

  // Delete a user
  deleteUser: async (userId) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.USERS, 'readwrite');
      const store = tx.objectStore(STORES.USERS);
      store.delete(userId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Failed to delete user'));
    });
  },

  // Save attendance record
  saveAttendance: async (log) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LOGS, 'readwrite');
      const store = tx.objectStore(STORES.LOGS);
      const now = new Date();
      // Ensure unique timestamp key even if multiple entries happen in same ms
      const uniqueTimestamp = `${now.toISOString()}_${Math.random().toString(36).slice(2, 7)}`;
      const entry = {
        ...log,
        timestamp: uniqueTimestamp,
        isoDate: now.toISOString(),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
      };
      store.put(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error || new Error('Failed to save attendance'));
    });
  },

  // Get all attendance logs
  getAttendanceLogs: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LOGS, 'readonly');
      const store = tx.objectStore(STORES.LOGS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error('Failed to retrieve logs'));
    });
  },

  // Clear all logs
  clearLogs: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.LOGS, 'readwrite');
      const store = tx.objectStore(STORES.LOGS);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Failed to clear logs'));
    });
  },

  // Check if attendance already marked today
  isAlreadyMarked: async (userId) => {
    try {
      const logs = await storage.getAttendanceLogs();
      const today = new Date().toLocaleDateString();
      return logs.some((log) => log.userId === userId && log.date === today);
    } catch {
      return false;
    }
  },
};
