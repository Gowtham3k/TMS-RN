import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider } from './context/AppContext';
import SplashScreen from './pages/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import RaiseComplaint from './pages/RaiseComplaint';
import ComplaintsList from './pages/ComplaintsList';
import UsersList from './pages/UsersList';
import MasterData from './pages/MasterData';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import SupportCenter from './pages/SupportCenter';
import SystemControl from './pages/SystemControl';
import storage from './utils/storage';

export default function App() {
    // Starting screen set to 'Splash' with 10-second loading circle & background image
    const [currentScreen, setCurrentScreen] = useState('Splash');
    const [screenParams, setScreenParams] = useState({});

    const navigation = useMemo(() => ({
        navigate: (screenName, params = {}) => {
            setTimeout(() => {
                setScreenParams(params || {});
                setCurrentScreen(screenName);
            }, 0);
        }
    }), []);

    const renderScreen = () => {
        const route = { params: screenParams };
        switch (currentScreen) {
            case 'Splash':
                return <SplashScreen navigation={navigation} route={route} />;
            case 'Login':
                return <Login navigation={navigation} route={route} />;
            case 'Register':
                return <Register navigation={navigation} route={route} />;
            case 'Home':
                return <Home navigation={navigation} route={route} />;
            case 'Dashboard':
                return <Dashboard navigation={navigation} route={route} />;
            case 'RaiseComplaint':
                return <RaiseComplaint navigation={navigation} route={route} />;
            case 'ComplaintsList':
                return <ComplaintsList navigation={navigation} route={route} />;
            case 'UsersList':
                return <UsersList navigation={navigation} route={route} />;
            case 'MasterData':
                return <MasterData navigation={navigation} route={route} />;
            case 'AuditLogs':
                return <AuditLogs navigation={navigation} route={route} />;
            case 'Reports':
                return <Reports navigation={navigation} route={route} />;
            case 'Settings':
                return <Settings navigation={navigation} route={route} />;
            case 'SupportCenter':
                return <SupportCenter navigation={navigation} route={route} />;
            case 'SystemControl':
                return <SystemControl navigation={navigation} route={route} />;
            default:
                return <Home navigation={navigation} route={route} />;
        }
    };

    return (
        <SafeAreaProvider>
            <AppProvider>
                <SafeAreaView style={styles.container}>
                    {renderScreen()}
                </SafeAreaView>
            </AppProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    }
});
