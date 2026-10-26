import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Shield, Search, Filter, Calendar, User, X, RotateCcw, Clock } from 'lucide-react-native';

const AuditLogs = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
    const [datePreset, setDatePreset] = useState('ALL'); // 'ALL', 'TODAY', 'WEEK', 'MONTH', 'CUSTOM'
    const [customDate, setCustomDate] = useState('');
    const [selectedAction, setSelectedAction] = useState('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/audit');
            setLogs(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // Extract unique actions & user roles for quick filters
    const availableActions = useMemo(() => {
        const actionsSet = new Set();
        logs.forEach(l => {
            if (l.action) actionsSet.add(l.action);
        });
        return Array.from(actionsSet);
    }, [logs]);

    const availableUsers = useMemo(() => {
        const usersMap = new Map();
        logs.forEach(l => {
            if (l.user) {
                const key = l.user._id || l.user.name;
                if (key && !usersMap.has(key)) {
                    usersMap.set(key, { id: key, name: l.user.name, role: l.user.role });
                }
            }
        });
        return Array.from(usersMap.values());
    }, [logs]);

    // Filtering logic
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // 1. Text Search (User Name, Email, Details, Action)
            const query = searchQuery.toLowerCase().trim();
            const userName = (log.user?.name || 'System').toLowerCase();
            const userEmail = (log.user?.email || '').toLowerCase();
            const userRole = (log.user?.role || 'System').toLowerCase();
            const actionText = (log.action || '').toLowerCase();
            const detailsText = (log.details || '').toLowerCase();

            if (query) {
                const matchesQuery =
                    userName.includes(query) ||
                    userEmail.includes(query) ||
                    userRole.includes(query) ||
                    actionText.includes(query) ||
                    detailsText.includes(query);
                if (!matchesQuery) return false;
            }

            // 2. User Filter
            if (selectedUserFilter !== 'ALL') {
                if (selectedUserFilter === 'SYSTEM') {
                    if (log.user) return false;
                } else {
                    const logUserId = log.user?._id || log.user?.name;
                    if (logUserId !== selectedUserFilter && userRole.toUpperCase() !== selectedUserFilter) {
                        return false;
                    }
                }
            }

            // 3. Action Filter
            if (selectedAction !== 'ALL' && log.action !== selectedAction) {
                return false;
            }

            // 4. Date Filter
            if (log.timestamp) {
                const logDate = new Date(log.timestamp);
                const now = new Date();

                if (datePreset === 'TODAY') {
                    const todayStr = now.toISOString().split('T')[0];
                    const logDateStr = logDate.toISOString().split('T')[0];
                    if (todayStr !== logDateStr) return false;
                } else if (datePreset === 'WEEK') {
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (logDate < sevenDaysAgo) return false;
                } else if (datePreset === 'MONTH') {
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    if (logDate < thirtyDaysAgo) return false;
                } else if (datePreset === 'CUSTOM' && customDate.trim()) {
                    const targetDateStr = customDate.trim();
                    const logDateISO = logDate.toISOString().split('T')[0];
                    const logDateLocale = logDate.toLocaleDateString();
                    if (!logDateISO.includes(targetDateStr) && !logDateLocale.includes(targetDateStr)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [logs, searchQuery, selectedUserFilter, selectedAction, datePreset, customDate]);

    const isFilterActive = searchQuery || selectedUserFilter !== 'ALL' || selectedAction !== 'ALL' || datePreset !== 'ALL' || customDate;

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedUserFilter('ALL');
        setSelectedAction('ALL');
        setDatePreset('ALL');
        setCustomDate('');
    };

    const renderItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                pressed && [styles.cardPressed, { borderColor: colors.navy }]
            ]}
        >
            <View style={styles.headerRow}>
                <View style={[styles.badge, { backgroundColor: colors.navy }]}>
                    <Shield size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeText}>{item.action}</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
            <Text style={[styles.details, { color: colors.textPrimary }]}>{item.details}</Text>
            <View style={styles.userRow}>
                <User size={13} color={colors.gold} style={{ marginRight: 4 }} />
                <Text style={styles.userText}>
                    {item.user?.name || 'System'} {item.user?.role ? `(${item.user.role})` : '(System)'}
                </Text>
            </View>
        </Pressable>
    );

    return (
        <Layout
            title={t('audit_logs')}
            subtitle={t('security_trail_extended_desc')}
            navigation={navigation}
            currentRoute="AuditLogs"
        >
            <View style={styles.container}>
                {/* Search Bar & Toggle Filter */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                        <Search size={18} color={isDark ? colors.gold : colors.navy} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder="Search logs by user, action or details..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.filterToggleBtn,
                            { backgroundColor: showAdvancedFilters || isFilterActive ? colors.navy : (isDark ? '#1e293b' : '#eff6ff'), borderColor: colors.cardBorder }
                        ]}
                        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                        <Filter size={18} color={showAdvancedFilters || isFilterActive ? '#f59e0b' : colors.navy} />
                    </TouchableOpacity>
                </View>

                {/* Advanced Filter Box */}
                {(showAdvancedFilters || isFilterActive) && (
                    <View style={[styles.filterPanel, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                        {/* Header & Reset Button */}
                        <View style={styles.panelHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Filter size={16} color={colors.gold} style={{ marginRight: 6 }} />
                                <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Filter Options</Text>
                            </View>
                            {isFilterActive ? (
                                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                                    <RotateCcw size={14} color="#ef4444" style={{ marginRight: 4 }} />
                                    <Text style={styles.resetText}>Reset All</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Date Filter Pills */}
                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                            <Calendar size={13} color={colors.gold} style={{ marginRight: 4 }} /> Filter by Date:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                            {[
                                { id: 'ALL', label: 'All Time' },
                                { id: 'TODAY', label: 'Today' },
                                { id: 'WEEK', label: 'Last 7 Days' },
                                { id: 'MONTH', label: 'Last 30 Days' },
                                { id: 'CUSTOM', label: 'Custom Date' }
                            ].map(p => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.pill,
                                        datePreset === p.id
                                            ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                            : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                    ]}
                                    onPress={() => setDatePreset(p.id)}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            datePreset === p.id ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }
                                        ]}
                                    >
                                        {p.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Custom Date Input */}
                        {datePreset === 'CUSTOM' && (
                            <View style={styles.customDateWrapper}>
                                <TextInput
                                    style={[styles.customDateInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                    placeholder="Enter Date (YYYY-MM-DD)"
                                    placeholderTextColor="#94a3b8"
                                    value={customDate}
                                    onChangeText={setCustomDate}
                                />
                            </View>
                        )}

                        {/* User Filter Pills */}
                        <Text style={[styles.filterLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                            <User size={13} color={colors.gold} style={{ marginRight: 4 }} /> Filter by User / Role:
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                            <TouchableOpacity
                                style={[
                                    styles.pill,
                                    selectedUserFilter === 'ALL'
                                        ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                        : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                ]}
                                onPress={() => setSelectedUserFilter('ALL')}
                            >
                                <Text style={[styles.pillText, selectedUserFilter === 'ALL' ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }]}>All Users</Text>
                            </TouchableOpacity>

                            {['SUPER_ADMIN', 'ADMIN', 'STAFF', 'USER', 'SYSTEM'].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[
                                        styles.pill,
                                        selectedUserFilter === r
                                            ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                            : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                    ]}
                                    onPress={() => setSelectedUserFilter(r)}
                                >
                                    <Text style={[styles.pillText, selectedUserFilter === r ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }]}>{r}</Text>
                                </TouchableOpacity>
                            ))}

                            {availableUsers.map(u => (
                                <TouchableOpacity
                                    key={u.id}
                                    style={[
                                        styles.pill,
                                        selectedUserFilter === u.id
                                            ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                            : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                    ]}
                                    onPress={() => setSelectedUserFilter(u.id)}
                                >
                                    <Text style={[styles.pillText, selectedUserFilter === u.id ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }]}>{u.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Action Filter Pills */}
                        {availableActions.length > 0 && (
                            <>
                                <Text style={[styles.filterLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                                    <Shield size={13} color={colors.gold} style={{ marginRight: 4 }} /> Filter by Action:
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                                    <TouchableOpacity
                                        style={[
                                            styles.pill,
                                            selectedAction === 'ALL'
                                                ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                        ]}
                                        onPress={() => setSelectedAction('ALL')}
                                    >
                                        <Text style={[styles.pillText, selectedAction === 'ALL' ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }]}>All Actions</Text>
                                    </TouchableOpacity>

                                    {availableActions.map(act => (
                                        <TouchableOpacity
                                            key={act}
                                            style={[
                                                styles.pill,
                                                selectedAction === act
                                                    ? { backgroundColor: colors.navy, borderColor: '#f59e0b' }
                                                    : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: colors.cardBorder }
                                            ]}
                                            onPress={() => setSelectedAction(act)}
                                        >
                                            <Text style={[styles.pillText, selectedAction === act ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.textPrimary }]}>{act}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
                )}

                {/* Counter Bar */}
                <View style={styles.counterRow}>
                    <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                        Showing <Text style={{ fontWeight: 'bold', color: colors.gold }}>{filteredLogs.length}</Text> of {logs.length} audit logs
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                ) : (
                    <FlatList
                        data={filteredLogs}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {isFilterActive ? 'No audit logs match your filter criteria.' : t('no_audit_logs_found')}
                                </Text>
                                {isFilterActive && (
                                    <TouchableOpacity style={[styles.resetEmptyBtn, { backgroundColor: colors.navy }]} onPress={resetFilters}>
                                        <Text style={styles.resetEmptyText}>Clear Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />
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
    searchSection: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        borderWidth: 0,
    },
    filterToggleBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    filterPanel: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        elevation: 2,
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    panelTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resetText: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 'bold',
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    pillsScroll: {
        gap: 8,
        paddingBottom: 4,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    pillText: {
        fontSize: 12,
    },
    customDateWrapper: {
        marginTop: 8,
    },
    customDateInput: {
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
        fontSize: 13,
    },
    counterRow: {
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    counterText: {
        fontSize: 12,
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardPressed: {
        transform: [{ scale: 0.985 }],
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    details: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userText: {
        fontSize: 12,
        color: '#d97706',
        fontWeight: '600',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    resetEmptyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    resetEmptyText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    }
});

export default AuditLogs;
