import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator, Pressable } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Power, Save } from 'lucide-react-native';

const SystemControl = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/settings');
                if (res.data.isSystemUnderMaintenance !== undefined) {
                    setMaintenanceMode(res.data.isSystemUnderMaintenance);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setSaving(true);
        try {
            await api.put(`/api/settings/isSystemUnderMaintenance`, { value: maintenanceMode });
            Alert.alert('Success', 'System settings updated successfully!');
        } catch (err) {
            Alert.alert('Error', t('failed_to_update'));
        } finally {
            setSaving(false);
        }
    };

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={t('system_control')}
            subtitle={t('admin_subtitle')}
            navigation={navigation}
            currentRoute="SystemControl"
        >
            <View style={styles.container}>
                {loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                ) : (
                    <View style={[styles.card, cardDynamicStyle]}>
                        <View style={styles.headerRow}>
                            <View style={[styles.powerIcon, { backgroundColor: maintenanceMode ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2') : (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'), borderColor: colors.cardBorder }]}>
                                <Power size={28} color={maintenanceMode ? '#ef4444' : colors.navy} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('system_status')}</Text>
                                <Text style={[styles.statusText, { color: maintenanceMode ? '#ef4444' : colors.gold }]}>
                                    {maintenanceMode ? t('system_off') : t('system_on')}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.toggleRow, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }]}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>{t('maintenance_mode')}</Text>
                                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>{t('maintenance_desc')}</Text>
                            </View>
                            <Switch
                                value={maintenanceMode}
                                onValueChange={setMaintenanceMode}
                                trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                                thumbColor={maintenanceMode ? '#f59e0b' : '#f8fafc'}
                            />
                        </View>

                        <Pressable
                            style={({ pressed }) => [
                                styles.saveBtn,
                                { backgroundColor: colors.navy },
                                pressed && styles.saveBtnPressed
                            ]}
                            onPress={saveSettings}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <View style={styles.saveContent}>
                                    <Save size={18} color="#f59e0b" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveBtnText}>{t('save_status')}</Text>
                                </View>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        padding: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    powerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    toggleTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    toggleDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    saveBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 14,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
        elevation: 2,
    },
    saveBtnPressed: {
        backgroundColor: '#1e40af',
        transform: [{ scale: 0.985 }],
    },
    saveContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    }
});

export default SystemControl;
