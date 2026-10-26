import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, LayoutGrid, Database, ListChecks, Users, FileText, Settings, LogOut, Plus, Shield, Power, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import storage from '../utils/storage';

const Sidebar = ({ isOpen, setIsOpen, navigation, currentRoute }) => {
    const { t, colors, isDark } = useApp();
    const userString = storage.getItem('user');
    let user = { role: 'USER' };
    try {
        if (userString) user = JSON.parse(userString);
    } catch (e) { }

    const handleLogout = () => {
        storage.removeItem('token');
        storage.removeItem('user');
        if (setIsOpen) setIsOpen(false);
        navigation.navigate('Login');
    };

    const navigateTo = (screenName) => {
        if (setIsOpen) setIsOpen(false);
        navigation.navigate(screenName);
    };

    const renderNavItem = (labelKey, icon, targetScreen) => {
        const isActive = currentRoute === targetScreen;
        const IconComponent = icon;

        return (
            <Pressable
                key={targetScreen}
                style={({ pressed }) => [
                    styles.navItem,
                    isActive && styles.activeNavItem,
                    pressed && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(30, 58, 138, 0.08)' }
                ]}
                onPress={() => navigateTo(targetScreen)}
            >
                <IconComponent size={20} color={isActive ? '#f59e0b' : (isDark ? '#94a3b8' : '#64748b')} style={styles.navIcon} />
                <Text style={[styles.navText, { color: isDark ? '#94a3b8' : '#334155' }, isActive && styles.activeNavText]}>{t(labelKey)}</Text>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={isOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setIsOpen(false)}
        >
            <SafeAreaView style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
                <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: colors.cardBorder, borderWidth: 1 }]}>
                    <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
                        <View style={styles.logoRow}>
                            <View style={styles.logoBadge}>
                                <Text style={styles.logoText}>TMS</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.navList} contentContainerStyle={{ paddingBottom: 20 }}>
                        {renderNavItem('home', Home, 'Home')}

                        {user.role !== 'ADMIN' && renderNavItem('dashboard', LayoutGrid, 'Dashboard')}

                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && renderNavItem('master_data', Database, 'MasterData')}
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && renderNavItem('audit_logs', Shield, 'AuditLogs')}
                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && renderNavItem('system_control', Power, 'SystemControl')}

                        {renderNavItem('complaints', ListChecks, 'ComplaintsList')}

                        {user.role !== 'STAFF' && renderNavItem('raise_complaint', Plus, 'RaiseComplaint')}

                        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && renderNavItem('user_management', Users, 'UsersList')}

                        {user.role !== 'STAFF' && renderNavItem('reports', FileText, 'Reports')}

                        {renderNavItem('settings', Settings, 'Settings')}
                    </ScrollView>

                    <Pressable
                        style={({ pressed }) => [
                            styles.logoutBtn,
                            { borderTopColor: colors.cardBorder },
                            pressed && styles.logoutBtnPressed
                        ]}
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text style={styles.logoutText}>{t('logout')}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
    },
    container: {
        width: '80%',
        maxWidth: 320,
        height: '100%',
        backgroundColor: '#0f172a',
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoBadge: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    logoText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    titleText: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    },
    navList: {
        flex: 1,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 8,
    },
    activeNavItem: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
    },
    navIcon: {
        marginRight: 12,
    },
    navText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '500',
    },
    activeNavText: {
        color: '#fbbf24',
        fontWeight: 'bold',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
        gap: 12,
        borderRadius: 12,
    },
    logoutBtnPressed: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '600',
    }
});

export default Sidebar;
