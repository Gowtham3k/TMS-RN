import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, Pressable } from 'react-native';
import { Search, User as UserIcon, LogOut, Menu, Settings as SettingsIcon } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import NotificationCenter from '../NotificationCenter';
import storage from '../../utils/storage';

const Header = ({ title, subtitle, onSearch, navigation, onOpenSidebar }) => {
    const { t, colors, isDark } = useApp();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const userObj = JSON.parse(storage.getItem('user') || '{}');
    const userName = userObj.name || 'User';
    const userEmail = userObj.email || 'support@tms.com';

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1e3a8a&color=f59e0b&size=128`;
    const [avatar, setAvatar] = useState(defaultAvatar);

    useEffect(() => {
        const userId = userObj._id || userObj.id || 'guest';
        const savedPhoto = storage.getItem(`profilePhoto_${userId}`);
        if (savedPhoto) setAvatar(savedPhoto);
    }, [userObj._id, userObj.id]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (onSearch) onSearch(text);
    };

    const handleLogout = () => {
        setShowProfileMenu(false);
        storage.removeItem('token');
        storage.removeItem('user');
        if (navigation) navigation.navigate('Login');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
            <View style={styles.topRow}>
                {onOpenSidebar && (
                    <TouchableOpacity onPress={onOpenSidebar} style={styles.menuBtn}>
                        <Menu size={24} color={isDark ? '#f59e0b' : '#1e3a8a'} />
                    </TouchableOpacity>
                )}

                <View style={styles.titleContainer}>
                    {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
                    {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>

                <View style={styles.actionsRight}>
                    <TouchableOpacity
                        onPress={() => navigation && navigation.navigate('Settings')}
                        style={styles.iconBtn}
                        accessibilityLabel="Settings"
                    >
                        <SettingsIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                    </TouchableOpacity>
                    <NotificationCenter navigation={navigation} />
                    <TouchableOpacity onPress={() => setShowProfileMenu(true)} activeOpacity={0.8}>
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showProfileMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileMenu(false)}
            >
                <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]} activeOpacity={1} onPress={() => setShowProfileMenu(false)}>
                    <View style={[styles.profileMenu, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                        <View style={[styles.profileHeader, { borderBottomColor: colors.cardBorder }]}>
                            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userName}</Text>
                            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                pressed && { backgroundColor: colors.subtleBg }
                            ]}
                            onPress={() => {
                                setShowProfileMenu(false);
                                if (navigation) navigation.navigate('Settings');
                            }}
                        >
                            <UserIcon size={18} color={colors.navy} />
                            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{t('profile')}</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                pressed && { backgroundColor: colors.subtleBg }
                            ]}
                            onPress={() => {
                                setShowProfileMenu(false);
                                if (navigation) navigation.navigate('Settings');
                            }}
                        >
                            <SettingsIcon size={18} color="#f59e0b" />
                            <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>{t('settings')}</Text>
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.menuItem,
                                styles.logoutItem,
                                { borderTopColor: colors.cardBorder },
                                pressed && { backgroundColor: colors.subtleBg }
                            ]}
                            onPress={handleLogout}
                        >
                            <LogOut size={18} color="#ef4444" />
                            <Text style={styles.logoutText}>{t('logout')}</Text>
                        </Pressable>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    menuBtn: {
        padding: 6,
        marginRight: 8,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    actionsRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#f59e0b',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        height: 44,
    },
    searchContainerFocused: {
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 0,
        borderWidth: 0,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 16,
    },
    profileMenu: {
        backgroundColor: '#ffffff',
        width: 240,
        borderRadius: 16,
        padding: 14,
        elevation: 6,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileHeader: {
        paddingBottom: 10,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    profileName: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#0f172a',
    },
    profileEmail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        gap: 10,
    },
    menuItemText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    logoutItem: {
        marginTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    },
    logoutText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '600',
    }
});

export default Header;
