import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { CheckCircle, Clock, Briefcase, Zap, Shield, ArrowRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import api from '../../api';
import Layout from '../Layout';

const StaffDashboard = ({ stats = {}, user, navigation }) => {
    const { t, colors, isDark } = useApp();
    const [assignedComplaints, setAssignedComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssigned = async () => {
            try {
                const res = await api.get('/api/complaints');
                if (Array.isArray(res.data)) {
                    const sorted = [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setAssignedComplaints(sorted.slice(0, 6));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssigned();
    }, []);

    const firstName = user?.name ? user.name.split(' ')[0] : 'Staff';

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={`${t('support_workspace')}: ${t('welcome')}, ${firstName}! ✨`}
            subtitle={t('staff_portal_subtitle')}
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
                        <Briefcase size={22} color="#f59e0b" />
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
                        <Text style={styles.statLbl}>{t('completed')}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#1e40af' }]}>
                        <Zap size={22} color="#ffffff" />
                        <Text style={styles.statVal}>{stats.inProgress || 0}</Text>
                        <Text style={styles.statLbl}>{t('in_progress')}</Text>
                    </View>
                </View>

                {/* Assigned Operations Log */}
                <View style={[styles.card, cardDynamicStyle]}>
                    <View style={[styles.cardHeader, { borderBottomColor: colors.cardBorder }]}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('assigned_ops_log')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ComplaintsList')}>
                            <Text style={[styles.linkText, { color: colors.navy }]}>{t('view_all')}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator style={{ padding: 20 }} color={colors.navy} />
                    ) : assignedComplaints.length > 0 ? (
                        assignedComplaints.map(item => (
                            <Pressable
                                key={item._id}
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
                                        { backgroundColor: item.priority === 'High' ? '#ef4444' : item.priority === 'Medium' ? '#d97706' : '#94a3b8' }
                                    ]} />
                                    <View>
                                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.type} • #{item._id.slice(-6).toUpperCase()}</Text>
                                    </View>
                                </View>
                                <ArrowRight size={18} color={colors.textSecondary} />
                            </Pressable>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_tasks_assigned')}</Text>
                        </View>
                    )}
                </View>

                {/* Efficiency Box */}
                <View style={styles.bannerCard}>
                    <Text style={styles.bannerTitle}>{t('res_efficiency')}</Text>
                    <Text style={styles.bannerDesc}>{t('res_efficiency_desc')}</Text>
                    <View style={styles.bannerRow}>
                        <View>
                            <Text style={styles.bannerSubLbl}>{t('sla_adherence')}</Text>
                            <Text style={styles.bannerVal}>96%</Text>
                        </View>
                        <View>
                            <Text style={styles.bannerSubLbl}>{t('resolution_score')}</Text>
                            <Text style={styles.bannerVal}>EXPERT</Text>
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
    bannerCard: {
        backgroundColor: '#1e3a8a',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    bannerTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bannerDesc: {
        color: '#e2e8f0',
        fontSize: 12,
        marginTop: 6,
        lineHeight: 18,
    },
    bannerRow: {
        flexDirection: 'row',
        gap: 30,
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    bannerSubLbl: {
        color: '#fbbf24',
        fontSize: 10,
        fontWeight: '600',
    },
    bannerVal: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    }
});

export default StaffDashboard;
