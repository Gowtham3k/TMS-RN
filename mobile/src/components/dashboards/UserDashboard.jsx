import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Plus, Clock, CheckCircle, ListChecks, ArrowRight, User as UserIcon, HelpCircle, FileText, Zap, MessageSquare, Settings as SettingsIcon } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import api from '../../api';
import Layout from '../Layout';

const UserDashboard = ({ user, navigation }) => {
    const { t, colors, isDark } = useApp();
    const [allComplaints, setAllComplaints] = useState([]);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/complaints');
            const data = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllComplaints(data);
            setStats({
                total: data.length,
                pending: data.filter(c => c.status === 'Pending').length,
                inProgress: data.filter(c => c.status === 'In Progress').length,
                resolved: data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
            });
            setRecentComplaints(data.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const quickActions = [
        { id: 'raise', title: 'Raise Ticket', icon: Plus, screen: 'RaiseComplaint', color: '#1e3a8a', desc: 'Create ticket' },
        { id: 'view', title: 'My Tickets', icon: ListChecks, screen: 'ComplaintsList', color: '#d97706', desc: 'Track progress' },
        { id: 'settings', title: 'Settings', icon: SettingsIcon, screen: 'Settings', color: '#1e3a8a', desc: 'Profile & theme' },
        { id: 'help', title: 'Support', icon: HelpCircle, screen: 'SupportCenter', color: '#d97706', desc: 'FAQs & help' },
    ];

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { color: '#f59e0b', bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fff7ed', border: '#fde68a' };
            case 'in progress': return { color: isDark ? '#60a5fa' : '#1e3a8a', bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', border: '#bfdbfe' };
            case 'resolved': return { color: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#f0fdf4', border: '#bbf7d0' };
            default: return { color: colors.textSecondary, bg: colors.inputBg, border: colors.cardBorder };
        }
    };

    const firstName = user?.name ? user.name.split(' ')[0] : 'User';

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={`${t('user_intelligence')}: ${t('welcome')}, ${firstName}!`}
            subtitle={t('user_portal_subtitle')}
            navigation={navigation}
            currentRoute="Dashboard"
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.statCard,
                            { backgroundColor: '#1e3a8a', borderColor: 'rgba(245, 158, 11, 0.4)', borderWidth: 1 },
                            pressed && styles.statCardPressed
                        ]}
                        onPress={() => navigation.navigate('ComplaintsList')}
                    >
                        <FileText size={24} color="#f59e0b" />
                        <Text style={styles.statVal}>{stats.total}</Text>
                        <Text style={styles.statLbl}>{t('ticket_volume')}</Text>
                    </Pressable>

                    <View style={[styles.statCard, { backgroundColor: '#d97706' }]}>
                        <Clock size={24} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.pending}</Text>
                        <Text style={styles.statLbl}>{t('awaiting_triage')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
                        <Zap size={24} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.inProgress}</Text>
                        <Text style={styles.statLbl}>{t('active_resolution')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#15803d' }]}>
                        <CheckCircle size={24} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.resolved}</Text>
                        <Text style={styles.statLbl}>{t('successful_closure')}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('strategic_actions')}</Text>
                <View style={styles.quickGrid}>
                    {quickActions.map(action => {
                        const IconComponent = action.icon;
                        return (
                            <Pressable
                                key={action.id}
                                style={({ pressed }) => [
                                    styles.quickCard,
                                    cardDynamicStyle,
                                    pressed && [styles.quickCardPressed, { backgroundColor: colors.subtleBg }]
                                ]}
                                onPress={() => navigation.navigate(action.screen)}
                            >
                                <View style={[styles.quickIconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : (action.color === '#1e3a8a' ? '#eff6ff' : '#fff7ed') }]}>
                                    <IconComponent size={22} color={isDark ? colors.gold : action.color} />
                                </View>
                                <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>{action.title}</Text>
                                <Text style={[styles.quickDesc, { color: colors.textSecondary }]}>{action.desc}</Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Recent Complaints Log */}
                <View style={[styles.logCard, cardDynamicStyle]}>
                    <View style={[styles.logHeader, { borderBottomColor: colors.cardBorder }]}>
                        <Text style={[styles.logTitle, { color: colors.textPrimary }]}>{t('operation_log')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ComplaintsList')}>
                            <Text style={[styles.reviewText, { color: colors.navy }]}>{t('review_archive')}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={colors.navy} />
                    ) : recentComplaints.length > 0 ? (
                        recentComplaints.map((c) => {
                            const statusStyle = getStatusColor(c.status);
                            return (
                                <Pressable
                                    key={c._id}
                                    style={({ pressed }) => [
                                        styles.logItem,
                                        { borderBottomColor: colors.cardBorder },
                                        pressed && { backgroundColor: colors.subtleBg }
                                    ]}
                                    onPress={() => navigation.navigate('ComplaintsList')}
                                >
                                    <View style={[styles.logIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                                        <MessageSquare size={16} color={colors.navy} />
                                    </View>
                                    <View style={styles.logInfo}>
                                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{c.title}</Text>
                                        <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{c.type} • #{c._id.slice(-6).toUpperCase()}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{c.status}</Text>
                                    </View>
                                </Pressable>
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active tickets recorded.</Text>
                        </View>
                    )}
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
        alignItems: 'flex-start',
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
        marginTop: 8,
    },
    statLbl: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    quickCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    quickCardPressed: {
        borderColor: '#1e3a8a',
        transform: [{ scale: 0.98 }],
    },
    quickIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    quickDesc: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
        textAlign: 'center',
    },
    logCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    logTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    reviewText: {
        color: '#1e3a8a',
        fontSize: 13,
        fontWeight: 'bold',
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 10,
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
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    itemMeta: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 13,
    }
});

export default UserDashboard;
