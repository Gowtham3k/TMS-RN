import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import storage from './utils/storage';

const getBaseUrl = () => {
    // 1. Web browser — backend runs on port 5001
    if (Platform.OS === 'web') {
        return 'http://localhost:5001';
    }

    // 2. Dynamic host IP from Expo Metro packager
    let host = null;
    if (Constants.expoConfig?.hostUri) {
        host = Constants.expoConfig.hostUri.split(':')[0];
    } else if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
        host = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
    } else if (Constants.manifest?.debuggerHost) {
        host = Constants.manifest.debuggerHost.split(':')[0];
    } else if (NativeModules.SourceCode?.scriptURL) {
        const parts = NativeModules.SourceCode.scriptURL.split('://');
        if (parts.length > 1) {
            host = parts[1].split(':')[0].split('/')[0];
        }
    }

    if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:5001`;
    }

    // 3. Fallback to PC LAN IP
    return 'http://172.23.103.7:5001';
};

const API_BASE_URL = getBaseUrl();
console.log('[TMS Mobile] Connecting to API at:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = storage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
