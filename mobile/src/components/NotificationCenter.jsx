import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import api from '../api';
import { Bell, Info, AlertTriangle, X, Check, Key, ArrowRight, ShieldAlert } from 'lucide-react-native';
import storage from '../utils/storage';

const NotificationCenter = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [approvingId, setApprovingId] = useState(null);
    const [approvedIds, setApprovedIds] = useState([]);
    const [statusBanner, setStatusBanner] = useState(null);

    const userStr = storage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            if (!currentUser.id && !currentUser._id) return;
            const userId = currentUser.id || currentUser._id;
            const unreadNotifs = (res.data || []).filter(n => !(n.isReadBy && n.isReadBy.includes(userId)));
            setNotifications(unreadNotifs);
            setUnreadCount(unreadNotifs.length);
        } catch (err) {
            // Silently handle offline/error
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 8000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        setNotifications(prev => prev.filter(n => n._id !== id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await api.put(`/api/notifications/read/${id}`, {});
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = async (n) => {
        await markAsRead(n._id);
        setShow(false);

        const titleLower = (n.title || '').toLowerCase();
        const msgLower = (n.message || '').toLowerCase();
        const compId = n.complaintId?._id || n.complaintId;

        if (compId || titleLower.includes('complaint') || titleLower.includes('ticket') || titleLower.includes('unlock')) {
            if (navigation) {
                navigation.navigate('ComplaintsList', { targetComplaintId: compId });
            }
        } else if (titleLower.includes('report') || msgLower.includes('report')) {
            if (currentUser.role !== 'STAFF' && navigation) {
                navigation.navigate('Reports');
            }
        }
    };

    const handleApproveUnlock = async (n, e) => {
        if (e && e.stopPropagation) e.stopPropagation();

        const compId = n.complaintId?._id || n.complaintId;
        if (!compId) {
            // If ID not stored, navigate admin directly to complaints list to approve
            handleNotificationClick(n);
            return;
        }

        setApprovingId(n._id);
        try {
            await api.put(`/api/complaints/${compId}/approve-unlock`, {});
            setApprovedIds(prev => [...prev, n._id]);
            setStatusBanner({ type: 'success', text: 'Ticket Unlocked! Staff can now edit and update the ticket.' });
            setTimeout(() => setStatusBanner(null), 4000);
            await markAsRead(n._id);
            fetchNotifications();
        } catch (err) {
            setStatusBanner({
                type: 'error',
                text: err.response?.data?.msg || 'Could not approve unlock request.'
            });
            setTimeout(() => setStatusBanner(null), 4000);
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <View>
            <TouchableOpacity onPress={() => setShow(true)} style={styles.bellBtn} activeOpacity={0.7}>
                <Bell size={22} color="#1e293b" />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={show}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShow(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Bell size={20} color="#1e3a8a" style={{ marginRight: 8 }} />
                                <Text style={styles.headerTitle}>Notifications</Text>
                                {unreadCount > 0 && (
                                    <View style={styles.pillCount}>
                                        <Text style={styles.pillCountText}>{unreadCount} new</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShow(false)} style={styles.closeBtn}>
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {statusBanner && (
                            <View style={[
                                styles.bannerBox,
                                { backgroundColor: statusBanner.type === 'success' ? '#ecfdf5' : '#fef2f2', borderColor: statusBanner.type === 'success' ? '#10b981' : '#ef4444' }
                            ]}>
                                <Text style={[
                                    styles.bannerText,
                                    { color: statusBanner.type === 'success' ? '#065f46' : '#991b1b' }
                                ]}>
                                    {statusBanner.text}
                                </Text>
                            </View>
                        )}

                        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 20 }}>
                            {notifications.length > 0 ? (
                                notifications.map(n => {
                                    const userId = currentUser.id || currentUser._id;
                                    const isRead = n.isReadBy && n.isReadBy.includes(userId);
                                    const isUnlockReq = n.actionType === 'UNLOCK_REQUEST' || (n.title || '').includes('Unlock Requested');
                                    const isApproved = approvedIds.includes(n._id);
                                    const isApproving = approvingId === n._id;

                                    return (
                                        <Pressable
                                            key={n._id}
                                            onPress={() => handleNotificationClick(n)}
                                            style={({ pressed }) => [
                                                styles.item,
                                                !isRead && styles.unreadItem,
                                                pressed && styles.itemPressed
                                            ]}
                                        >
                                            <View style={styles.itemTopRow}>
                                                <View style={[
                                                    styles.iconContainer,
                                                    isUnlockReq ? styles.iconUnlock : (n.type === 'BROADCAST' ? styles.iconBroadcast : styles.iconInfo)
                                                ]}>
                                                    {isUnlockReq ? (
                                                        <Key size={18} color="#d97706" />
                                                    ) : n.type === 'BROADCAST' ? (
                                                        <AlertTriangle size={18} color="#dc2626" />
                                                    ) : (
                                                        <Info size={18} color="#2563eb" />
                                                    )}
                                                </View>

                                                <View style={styles.textContainer}>
                                                    <View style={styles.titleRow}>
                                                        <Text style={styles.itemTitle}>{n.title}</Text>
                                                        {isUnlockReq && (
                                                            <View style={styles.unlockBadge}>
                                                                <Text style={styles.unlockBadgeText}>Action Required</Text>
                                                            </View>
                                                        )}
                                                    </View>

                                                    <Text style={styles.itemMessage}>{n.message}</Text>
                                                    <Text style={styles.itemTime}>
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Action buttons for Admin when Staff requests unlock */}
                                            {isAdmin && isUnlockReq && (
                                                <View style={styles.actionRow}>
                                                    {isApproved ? (
                                                        <View style={styles.approvedPill}>
                                                            <Check size={14} color="#15803d" style={{ marginRight: 4 }} />
                                                            <Text style={styles.approvedPillText}>Unlocked & Approved</Text>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity
                                                            style={[styles.approveBtn, isApproving && styles.btnDisabled]}
                                                            onPress={(e) => handleApproveUnlock(n, e)}
                                                            disabled={isApproving}
                                                        >
                                                            {isApproving ? (
                                                                <ActivityIndicator size="small" color="#ffffff" />
                                                            ) : (
                                                                <>
                                                                    <Check size={15} color="#ffffff" style={{ marginRight: 6 }} />
                                                                    <Text style={styles.approveBtnText}>Accept & Unlock</Text>
                                                                </>
                                                            )}
                                                        </TouchableOpacity>
                                                    )}

                                                    <TouchableOpacity
                                                        style={styles.reviewBtn}
                                                        onPress={() => handleNotificationClick(n)}
                                                    >
                                                        <Text style={styles.reviewBtnText}>Review Ticket</Text>
                                                        <ArrowRight size={13} color="#1e3a8a" style={{ marginLeft: 4 }} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No unread notifications</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    bellBtn: {
        padding: 6,
        position: 'relative',
        borderRadius: 20,
        backgroundColor: '#f8fafc',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    badgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        padding: 20,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    pillCount: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    pillCountText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1e3a8a',
    },
    closeBtn: {
        padding: 4,
    },
    bannerBox: {
        marginTop: 12,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    bannerText: {
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        marginTop: 10,
    },
    item: {
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        borderRadius: 14,
        marginBottom: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    itemPressed: {
        backgroundColor: '#f8fafc',
    },
    unreadItem: {
        backgroundColor: '#f8fafc',
        borderColor: '#e2e8f0',
    },
    itemTopRow: {
        flexDirection: 'row',
        gap: 12,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInfo: {
        backgroundColor: '#eff6ff',
    },
    iconUnlock: {
        backgroundColor: '#fef3c7',
    },
    iconBroadcast: {
        backgroundColor: '#fee2e2',
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f172a',
    },
    unlockBadge: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6,
    },
    unlockBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#b45309',
    },
    itemMessage: {
        fontSize: 13,
        color: '#475569',
        marginTop: 4,
        lineHeight: 18,
    },
    itemTime: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 6,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    approveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#15803d',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        elevation: 1,
    },
    approveBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    reviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    reviewBtnText: {
        color: '#1e3a8a',
        fontSize: 12,
        fontWeight: '600',
    },
    approvedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    approvedPillText: {
        color: '#15803d',
        fontSize: 12,
        fontWeight: '700',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    }
});

export default NotificationCenter;
