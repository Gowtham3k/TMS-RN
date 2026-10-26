import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Database, ListChecks, CheckCircle, Clock, Shield, Zap, TrendingUp, Plus, ArrowRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import api from '../../api';
import Layout from '../Layout';

const SuperAdminDashboard = ({ stats = {}, user, navigation }) => {
    const { t, colors, isDark } = useApp();
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await api.get('/api/audit');
                if (Array.isArray(res.data)) {
                    setAuditLogs(res.data.slice(0, 8));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    const firstName = user?.name ? user.name.split(' ')[0] : 'SuperAdmin';

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={`${t('master_control')}: ${t('welcome')}, ${firstName}! 👑`}
            subtitle="High-level system governance and global infrastructure orchestration."
            navigation={navigation}
            currentRoute="Dashboard"
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Stats */}
                <View style={styles.statsGrid}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.statCard,
                            { backgroundColor: '#1e3a8a', borderColor: 'rgba(245, 158, 11, 0.4)', borderWidth: 1 },
                            pressed && styles.statCardPressed
                        ]}
                        onPress={() => navigation.navigate('ComplaintsList')}
                    >
                        <ListChecks size={22} color="#f59e0b" />
                        <Text style={styles.statVal}>{stats.total || 0}</Text>
                        <Text style={styles.statLbl}>{t('total_complaints')}</Text>
                    </Pressable>

                    <View style={[styles.statCard, { backgroundColor: '#d97706' }]}>
                        <Clock size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.pending || 0}</Text>
                        <Text style={styles.statLbl}>{t('pending')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#15803d' }]}>
                        <CheckCircle size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.resolved || 0}</Text>
                        <Text style={styles.statLbl}>{t('completed')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
                        <Zap size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.inProgress || 0}</Text>
                        <Text style={styles.statLbl}>{t('in_progress')}</Text>
                    </View>
                </View>

                {/* System Audit */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('system_audit')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AuditLogs')}>
                            <Text style={[styles.linkText, { color: colors.navy }]}>{t('audit_logs')}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={colors.navy} />
                    ) : auditLogs.length > 0 ? (
                        auditLogs.map(log => (
                            <View key={log._id} style={[styles.logItem, { borderBottomColor: colors.cardBorder }]}>
                                <View style={[styles.logIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                                    <Shield size={16} color={colors.navy} />
                                </View>
                                <View style={styles.logInfo}>
                                    <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{log.action ? log.action.replace(/_/g, ' ') : 'Action'}</Text>
                                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{log.details || 'No details'}</Text>
                                </View>
                                <Text style={[styles.logTime, { color: colors.textSecondary }]}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_activity')}</Text>
                        </View>
                    )}
                </View>

                {/* Capacity Card */}
                <View style={[styles.capacityCard, cardDynamicStyle]}>
                    <Text style={[styles.capacityTitle, { color: colors.textPrimary }]}>{t('capacity_analysis')}</Text>
                    <View style={[styles.capacityRow, { borderTopColor: colors.cardBorder }]}>
                        <View>
                            <Text style={[styles.capLbl, { color: colors.textSecondary }]}>{t('avg_resolution')}</Text>
                            <Text style={[styles.capVal, { color: colors.navy }]}>4.2h</Text>
                        </View>
                        <View>
                            <Text style={[styles.capLbl, { color: colors.textSecondary }]}>{t('server_latency')}</Text>
                            <Text style={[styles.capVal, { color: colors.navy }]}>28ms</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    statCardPressed: {
        transform: [{ scale: 0.98 }],
    },
    statVal: {
        color: '#ffffff',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 6,
    },
    statLbl: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    linkText: {
        color: '#1e3a8a',
        fontSize: 13,
        fontWeight: 'bold',
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    logIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    logInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0f172a',
    },
    itemSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    logTime: {
        fontSize: 11,
        color: '#94a3b8',
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    capacityCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    capacityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 14,
    },
    capacityRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    capLbl: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
    },
    capVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textAlign: 'center',
        marginTop: 2,
    }
});

export default SuperAdminDashboard;
