import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LayoutGrid, ListChecks, ArrowRight, Plus, Sparkles, Activity, ShieldCheck, CheckCircle2, Shield } from 'lucide-react-native';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import storage from '../utils/storage';

const Home = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const userStr = storage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { name: 'User', role: 'USER' };
    const firstName = user.name ? user.name.split(' ')[0] : 'User';

    const isStaffOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(user.role);

    const dynamicCardStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    return (
        <Layout
            title={`${t('welcome')}, ${firstName}! 👑`}
            subtitle={t('sub_welcome') || "Your centralized command center for all support and system operations."}
            navigation={navigation}
            currentRoute="Home"
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <View style={styles.heroCard}>
                    <View style={styles.badgeRow}>
                        <Sparkles size={14} color="#f59e0b" />
                        <Text style={styles.badgeText}>
                            {isStaffOrAdmin ? t('hero_sub_staff') : t('hero_sub_user')}
                        </Text>
                    </View>

                    <Text style={styles.heroTitle}>
                        {isStaffOrAdmin ? t('hero_title_staff') : t('hero_title_user')}
                    </Text>

                    <Text style={styles.heroDesc}>
                        {isStaffOrAdmin ? t('hero_desc_staff') : t('hero_desc_user')}
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.heroBtn,
                            pressed && styles.heroBtnPressed
                        ]}
                        onPress={() => navigation.navigate(isStaffOrAdmin ? 'ComplaintsList' : 'RaiseComplaint')}
                    >
                        <Plus size={18} color="#1e3a8a" />
                        <Text style={styles.heroBtnText}>
                            {isStaffOrAdmin ? t('manage_assigned') : t('submit_support')}
                        </Text>
                    </Pressable>
                </View>

                {/* Cards Grid */}
                <View style={styles.gridContainer}>
                    {/* Dashboard Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            dynamicCardStyle,
                            pressed && styles.cardPressed
                        ]}
                        onPress={() => navigation.navigate('Dashboard')}
                    >
                        <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                            <LayoutGrid size={24} color={isDark ? '#60a5fa' : '#1e3a8a'} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('adv_monitor')}</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t('monitor_desc')}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={[styles.cardLink, { color: isDark ? '#60a5fa' : '#1e3a8a' }]}>{t('dashboard')}</Text>
                            <ArrowRight size={16} color={isDark ? '#60a5fa' : '#1e3a8a'} />
                        </View>
                    </Pressable>

                    {/* Complaints Card */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            dynamicCardStyle,
                            pressed && styles.cardPressed
                        ]}
                        onPress={() => navigation.navigate('ComplaintsList')}
                    >
                        <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fff7ed' }]}>
                            <ListChecks size={24} color="#f59e0b" />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('case_history')}</Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t('case_desc')}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={[styles.cardLink, { color: '#f59e0b' }]}>{t('track_progress')}</Text>
                            <ArrowRight size={16} color="#f59e0b" />
                        </View>
                    </Pressable>

                    {/* System Status Card */}
                    <View style={[styles.card, dynamicCardStyle]}>
                        <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                            <Activity size={24} color={isDark ? '#60a5fa' : '#1e3a8a'} />
                        </View>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('live_status')}</Text>
                        <View style={[styles.statusRow, { borderTopColor: colors.cardBorder }]}>
                            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Server Latency</Text>
                            <View style={styles.statusValBadge}>
                                <CheckCircle2 size={12} color="#10b981" style={{ marginRight: 4 }} />
                                <Text style={styles.statusVal}>24ms (Optimal)</Text>
                            </View>
                        </View>
                        <View style={[styles.statusRow, { borderTopColor: colors.cardBorder }]}>
                            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Tech Tier</Text>
                            <Text style={[styles.statusValText, { color: isDark ? '#60a5fa' : '#1e3a8a' }]}>Executive Tier 1</Text>
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
    heroCard: {
        backgroundColor: '#1e3a8a',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.18)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 6,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    badgeText: {
        color: '#fef3c7',
        fontSize: 12,
        fontWeight: 'bold',
    },
    heroTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 28,
    },
    heroDesc: {
        color: '#cbd5e1',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20,
    },
    heroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    heroBtnPressed: {
        backgroundColor: '#f8fafc',
        transform: [{ scale: 0.98 }],
    },
    heroBtnText: {
        color: '#1e3a8a',
        fontWeight: 'bold',
        fontSize: 14,
    },
    gridContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    cardPressed: {
        borderColor: '#1e3a8a',
        transform: [{ scale: 0.99 }],
    },
    iconBg: {
        width: 46,
        height: 46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardLink: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    statusLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    statusValBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusVal: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#10b981',
    },
    statusValText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e3a8a',
    }
});

export default Home;
