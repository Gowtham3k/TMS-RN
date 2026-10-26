import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { ListChecks, Users, CheckCircle, Clock, AlertCircle, Shield, ArrowRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import api from '../../api';
import Layout from '../Layout';

const AdminDashboard = ({ stats = {}, user, navigation }) => {
    const { t, colors, isDark } = useApp();
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const res = await api.get('/api/complaints');
                if (Array.isArray(res.data)) {
                    const sorted = [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setRecentComplaints(sorted.slice(0, 6));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    const firstName = user?.name ? user.name.split(' ')[0] : 'Admin';

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={`${t('admin_console')}: ${t('welcome')}, ${firstName}! 👑`}
            subtitle={t('admin_subtitle')}
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
                        <Text style={styles.statLbl}>{t('total_raised')}</Text>
                    </Pressable>

                    <View style={[styles.statCard, { backgroundColor: '#d97706' }]}>
                        <Clock size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.pending || 0}</Text>
                        <Text style={styles.statLbl}>{t('pending')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#15803d' }]}>
                        <CheckCircle size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.resolved || 0}</Text>
                        <Text style={styles.statLbl}>{t('resolved')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
                        <AlertCircle size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.inProgress || 0}</Text>
                        <Text style={styles.statLbl}>{t('in_progress')}</Text>
                    </View>
                </View>

                {/* Ticket Stream */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('global_ticket_stream')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ComplaintsList')}>
                            <Text style={[styles.linkText, { color: colors.navy }]}>{t('review_all')}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={colors.navy} />
                    ) : recentComplaints.length > 0 ? (
                        recentComplaints.map(c => (
                            <Pressable
                                key={c._id}
                                style={({ pressed }) => [
                                    styles.itemRow,
                                    { borderBottomColor: colors.cardBorder },
                                    pressed && { backgroundColor: colors.subtleBg }
                                ]}
                                onPress={() => navigation.navigate('ComplaintsList')}
                            >
                                <View style={styles.itemLeft}>
                                    <View style={[
                                        styles.priorityDot,
                                        { backgroundColor: c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#d97706' : '#94a3b8' }
                                    ]} />
                                    <View>
                                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{c.title}</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{c.raisedBy?.name || 'User'} • {c.department || 'General'}</Text>
                                    </View>
                                </View>
                                <ArrowRight size={18} color={colors.textSecondary} />
                            </Pressable>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_activity')}</Text>
                        </View>
                    )}
                </View>

                {/* Controls */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('operation_controls')}</Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.ctrlBtn,
                            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            pressed && { backgroundColor: colors.subtleBg, borderColor: colors.navy }
                        ]}
                        onPress={() => navigation.navigate('UsersList')}
                    >
                        <Users size={20} color={colors.navy} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.ctrlTitle, { color: colors.textPrimary }]}>{t('user_management')}</Text>
                            <Text style={[styles.ctrlSub, { color: colors.textSecondary }]}>{t('manage_users_desc')}</Text>
                        </View>
                    </Pressable>
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
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    itemSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    ctrlBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    ctrlTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    ctrlSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    }
});

export default AdminDashboard;
