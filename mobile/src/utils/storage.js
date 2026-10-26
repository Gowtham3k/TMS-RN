import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore = {};

export const storage = {
  getItem: (key) => {
    if (memoryStore[key] !== undefined && memoryStore[key] !== null) {
      return memoryStore[key];
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memoryStore[key] = val;
          return val;
        }
      } catch (e) { }
    }
    return null;
  },
  setItem: (key, value) => {
    memoryStore[key] = String(value);
    AsyncStorage.setItem(key, String(value)).catch(() => { });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, String(value));
      } catch (e) { }
    }
  },
  removeItem: (key) => {
    delete memoryStore[key];
    AsyncStorage.removeItem(key).catch(() => { });
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) { }
    }
  },
  init: async () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) memoryStore[k] = window.localStorage.getItem(k);
        }
      }
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      items.forEach(([k, v]) => {
        if (v !== null) memoryStore[k] = v;
      });
    } catch (e) {
      console.log('Error initializing storage', e);
    }
  }
};

export default storage;
