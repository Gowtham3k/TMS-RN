import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, Pressable, Image } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import storage from '../utils/storage';
import { CheckCircle2, X, AlertCircle, Shield, User as UserIcon, Lock, Moon, Sun, Globe, Bell, Sparkles } from 'lucide-react-native';

const Settings = ({ navigation }) => {
    const { theme, toggleTheme, language, setLanguage, t, colors, isDark } = useApp();
    const userStr = storage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    const [name, setName] = useState(user.name || '');
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
    const [bio, setBio] = useState(user.bio || '');
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [statusBanner, setStatusBanner] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => setStatusBanner(null), 4000);
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            const res = await api.put('/api/auth/profile', {
                name,
                phoneNumber,
                bio,
                emailNotifications: emailNotif,
                pushNotifications: pushNotif
            });
            const updatedUser = { ...user, ...res.data };
            storage.setItem('user', JSON.stringify(updatedUser));
            showNotification(t('save_changes') + ' - ' + (language === 'ta' ? 'வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Profile updated successfully!'), 'success');
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.message || 'Error saving profile';
            showNotification(errMsg, 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwords.current) {
            showNotification(language === 'ta' ? 'தற்போதைய கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your current password', 'error');
            return;
        }
        if (!passwords.new) {
            showNotification(language === 'ta' ? 'புதிய கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your new password', 'error');
            return;
        }
        if (passwords.new.length < 6) {
            showNotification(language === 'ta' ? 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் கொண்டிருக்க வேண்டும்' : 'New password must be at least 6 characters', 'error');
            return;
        }
        if (passwords.new !== passwords.confirm) {
            showNotification(language === 'ta' ? 'புதிய கடவுச்சொற்கள் பொருந்தவில்லை' : 'New passwords do not match', 'error');
            return;
        }

        setChangingPassword(true);
        try {
            await api.put('/api/auth/change-password', {
                oldPassword: passwords.current,
                newPassword: passwords.new
            });
            showNotification(language === 'ta' ? 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது!' : 'Password changed successfully!', 'success');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            const errMsg = err.response?.data?.msg || err.message || 'Error updating password';
            showNotification(errMsg, 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    const inputDynamicStyle = (isFocused) => ({
        backgroundColor: colors.inputBg,
        borderColor: isFocused ? colors.navy : colors.inputBorder,
        color: colors.textPrimary,
    });

    const roleMeta = {
        SUPER_ADMIN: { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: '👑 Super Admin' },
        ADMIN: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: '🛡️ Admin' },
        STAFF: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: '🔧 Support Staff' },
        USER: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: '👤 Campus User' },
    };
    const currentRole = roleMeta[user.role] || roleMeta.USER;

    return (
        <Layout
            title={t('settings')}
            subtitle="Manage your profile & preferences"
            navigation={navigation}
            currentRoute="Settings"
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {statusBanner && (
                    <View style={[styles.alertBanner, { backgroundColor: statusBanner.type === 'error' ? '#ef4444' : '#10b981' }]}>
                        {statusBanner.type === 'error' ? (
                            <AlertCircle size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        ) : (
                            <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Profile Identity Card */}
                <View style={[styles.identityCard, { backgroundColor: isDark ? '#1e293b' : '#1e3a8a' }]}>
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=f59e0b&color=1e3a8a&size=128` }}
                        style={styles.avatarImg}
                    />
                    <View style={styles.identityDetails}>
                        <Text style={styles.identityName}>{user.name || 'System User'}</Text>
                        <Text style={styles.identityEmail}>{user.email || 'support@tms.com'}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: currentRole.bg, borderColor: currentRole.border }]}>
                            <Text style={[styles.roleBadgeText, { color: currentRole.text }]}>{currentRole.label}</Text>
                        </View>
                    </View>
                </View>

                {/* Profile Section */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile_info')}</Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('full_name')}</Text>
                    <TextInput
                        style={[styles.input, inputDynamicStyle(focusedInput === 'name')]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your full name"
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('email_address')}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: colors.textSecondary, borderColor: colors.inputBorder }]}
                        value={user.email || ''}
                        editable={false}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                    <TextInput
                        style={[styles.input, inputDynamicStyle(focusedInput === 'phone')]}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        onFocus={() => setFocusedInput('phone')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('bio')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, inputDynamicStyle(focusedInput === 'bio')]}
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={3}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedInput('bio')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveBtn,
                            pressed && styles.saveBtnPressed,
                            savingProfile && { opacity: 0.7 }
                        ]}
                        onPress={handleSaveProfile}
                        disabled={savingProfile}
                    >
                        <Text style={styles.saveBtnText}>
                            {savingProfile ? 'Saving Changes...' : t('save_changes')}
                        </Text>
                    </Pressable>
                </View>

                {/* Password Section */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('password_and_security')}</Text>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('current_password')}</Text>
                    <TextInput
                        style={[styles.input, inputDynamicStyle(focusedInput === 'curr')]}
                        secureTextEntry
                        value={passwords.current}
                        onChangeText={(t) => setPasswords({ ...passwords, current: t })}
                        placeholder="Enter current password"
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedInput('curr')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('new_password')}</Text>
                    <TextInput
                        style={[styles.input, inputDynamicStyle(focusedInput === 'new')]}
                        secureTextEntry
                        value={passwords.new}
                        onChangeText={(t) => setPasswords({ ...passwords, new: t })}
                        placeholder="Enter new password (min. 6 chars)"
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedInput('new')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('confirm_password')}</Text>
                    <TextInput
                        style={[styles.input, inputDynamicStyle(focusedInput === 'conf')]}
                        secureTextEntry
                        value={passwords.confirm}
                        onChangeText={(t) => setPasswords({ ...passwords, confirm: t })}
                        placeholder="Confirm new password"
                        placeholderTextColor="#94a3b8"
                        onFocus={() => setFocusedInput('conf')}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveBtn,
                            pressed && styles.saveBtnPressed,
                            changingPassword && { opacity: 0.7 }
                        ]}
                        onPress={handleChangePassword}
                        disabled={changingPassword}
                    >
                        <Text style={styles.saveBtnText}>
                            {changingPassword ? 'Updating Password...' : t('change_password')}
                        </Text>
                    </Pressable>
                </View>

                {/* Display & Language */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('display_language')}</Text>

                    <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
                        <View>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('theme_mode')}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                Current: {isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
                            </Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#cbd5e1', true: colors.navy }}
                            thumbColor={isDark ? '#f59e0b' : '#f8fafc'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
                        <View>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('email_notif')}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                Ticket updates and status alerts
                            </Text>
                        </View>
                        <Switch
                            value={emailNotif}
                            onValueChange={setEmailNotif}
                            trackColor={{ false: '#cbd5e1', true: colors.navy }}
                            thumbColor={emailNotif ? '#f59e0b' : '#f8fafc'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
                        <View>
                            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Push Notifications</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                Real-time in-app banners
                            </Text>
                        </View>
                        <Switch
                            value={pushNotif}
                            onValueChange={setPushNotif}
                            trackColor={{ false: '#cbd5e1', true: colors.navy }}
                            thumbColor={pushNotif ? '#f59e0b' : '#f8fafc'}
                        />
                    </View>

                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('app_language')}</Text>
                        <Pressable
                            style={styles.langBadge}
                            onPress={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                        >
                            <Text style={styles.langText}>{language === 'en' ? 'English (US)' : 'தமிழ் (TA)'}</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    identityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 18,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    avatarImg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#f59e0b',
        marginRight: 16,
    },
    identityDetails: {
        flex: 1,
    },
    identityName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    identityEmail: {
        fontSize: 13,
        color: '#cbd5e1',
        marginTop: 2,
        marginBottom: 6,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
        marginTop: 8,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        color: '#0f172a',
        backgroundColor: '#f8fafc',
    },
    textArea: {
        height: 80,
        paddingTop: 10,
        textAlignVertical: 'top',
    },
    saveBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#f59e0b',
        elevation: 2,
    },
    saveBtnPressed: {
        backgroundColor: '#1e40af',
        transform: [{ scale: 0.985 }],
    },
    saveBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    rowLabel: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '500',
    },
    langBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    langText: {
        color: '#d97706',
        fontWeight: 'bold',
        fontSize: 13,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 14,
        elevation: 4,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    alertBannerText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    }
});

export default Settings;
