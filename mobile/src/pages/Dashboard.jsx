import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import api from '../api';
import UserDashboard from '../components/dashboards/UserDashboard';
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import StaffDashboard from '../components/dashboards/StaffDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import storage from '../utils/storage';

const Dashboard = ({ navigation }) => {
    const userStr = storage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, closed: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/complaints/stats');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    if (!user) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Loading user data...</Text>
            </View>
        );
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isAdmin = user.role === 'ADMIN';
    const isUser = user.role === 'USER';
    const isStaff = user.role === 'STAFF';

    if (isUser) return <UserDashboard stats={stats} user={user} navigation={navigation} />;
    if (isStaff) return <StaffDashboard stats={stats} user={user} navigation={navigation} />;
    if (isAdmin) return <AdminDashboard stats={stats} user={user} navigation={navigation} />;
    if (isSuperAdmin) return <SuperAdminDashboard stats={stats} user={user} navigation={navigation} />;

    return (
        <View style={styles.center}>
            <Text style={styles.heading}>Access Restrained</Text>
            <Text style={styles.text}>Please contact admin if you believe this is an error.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f1f5f9',
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: '#64748b',
    }
});

export default Dashboard;
