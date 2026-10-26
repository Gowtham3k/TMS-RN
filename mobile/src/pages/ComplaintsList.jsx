import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView, Alert, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import storage from '../utils/storage';
import { Search, MapPin, X, Trash2, UserCheck, CheckCircle2, Clock, Star, Lock, Key, AlertCircle, Check } from 'lucide-react-native';

const ComplaintsList = ({ navigation, route }) => {
    const { t, colors, isDark } = useApp();
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statusBanner, setStatusBanner] = useState(null);

    const [staffList, setStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [userFeedback, setUserFeedback] = useState('');

    // Unlock / Reopen request state
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockReason, setUnlockReason] = useState('');
    const [submittingUnlock, setSubmittingUnlock] = useState(false);

    // Delete Confirmation Dialog state
    const [deleteConfirmComplaint, setDeleteConfirmComplaint] = useState(null);
    const [isDeletingComplaint, setIsDeletingComplaint] = useState(false);

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => setStatusBanner(null), 4000);
    };

    const userStr = storage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/complaints');
            const data = res.data || [];
            const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setComplaints(sorted);
            setFilteredComplaints(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        if (!isAdmin) return;
        try {
            const res = await api.get('/api/complaints/staff');
            setStaffList(res.data || []);
        } catch (err) {
            console.error('Failed to fetch staff list', err);
        }
    };

    useEffect(() => {
        fetchComplaints();
        fetchStaff();
    }, []);

    useEffect(() => {
        const rawTarget = route?.params?.targetComplaintId;
        const targetId = typeof rawTarget === 'object' && rawTarget?._id ? rawTarget._id : rawTarget;
        if (targetId && complaints.length > 0) {
            const found = complaints.find(c => c._id === targetId);
            if (found) {
                setSelectedComplaint(found);
                setShowModal(true);
            }
        }
    }, [route?.params?.targetComplaintId, complaints]);

    useEffect(() => {
        let results = complaints.filter(c =>
            (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.department || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (statusFilter !== 'All') {
            results = results.filter(c => c.status === statusFilter);
        }

        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFilteredComplaints(results);
    }, [searchQuery, statusFilter, complaints]);

    const handleOpenDetails = (complaint) => {
        setSelectedComplaint(complaint);
        setSelectedStaffId(complaint.assignedTo?._id || complaint.assignedTo?.id || '');
        setStatusNote('');
        setShowModal(true);
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedComplaint) return;
        setUpdatingStatus(true);
        try {
            const res = await api.put(`/api/complaints/${selectedComplaint._id}/status`, {
                status: newStatus,
                note: statusNote || `Status updated to ${newStatus}`
            });
            showNotification('Updated successfully!', 'success');
            setSelectedComplaint(res.data);
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to update status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleRequestUnlock = async () => {
        if (!selectedComplaint) return;
        setSubmittingUnlock(true);
        try {
            const res = await api.post(`/api/complaints/${selectedComplaint._id}/request-unlock`, {
                reason: unlockReason.trim() || 'Work requires further updates or inspection'
            });
            showNotification('Unlock request sent to Admin!', 'success');
            setSelectedComplaint(res.data);
            setShowUnlockModal(false);
            setUnlockReason('');
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to submit unlock request', 'error');
        } finally {
            setSubmittingUnlock(false);
        }
    };

    const handleApproveUnlock = async () => {
        if (!selectedComplaint) return;
        setUpdatingStatus(true);
        try {
            const res = await api.put(`/api/complaints/${selectedComplaint._id}/approve-unlock`);
            showNotification('Ticket unlocked! Status reset to In Progress.', 'success');
            setSelectedComplaint(res.data);
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to approve unlock', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleRejectUnlock = async () => {
        if (!selectedComplaint) return;
        setUpdatingStatus(true);
        try {
            const res = await api.put(`/api/complaints/${selectedComplaint._id}/reject-unlock`);
            showNotification('Unlock request declined.', 'info');
            setSelectedComplaint(res.data);
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to decline unlock', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAssignStaff = async () => {
        if (!selectedComplaint || !selectedStaffId) {
            showNotification('Please select a staff member to assign.', 'error');
            return;
        }
        setUpdatingStatus(true);
        try {
            const res = await api.put(`/api/complaints/${selectedComplaint._id}/assign`, {
                adminId: selectedStaffId
            });
            showNotification('Assigned successfully!', 'success');
            setSelectedComplaint(res.data);
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to assign ticket.', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!selectedComplaint) return;
        try {
            await api.put(`/api/complaints/${selectedComplaint._id}/feedback`, {
                rating: userRating,
                feedback: userFeedback
            });
            showNotification('Submitted successfully!', 'success');
            setShowModal(false);
            fetchComplaints();
        } catch (err) {
            showNotification('Failed to submit feedback', 'error');
        }
    };

    const confirmDeleteComplaint = async () => {
        if (!deleteConfirmComplaint) return;
        setIsDeletingComplaint(true);
        try {
            await api.delete(`/api/complaints/${deleteConfirmComplaint._id}`);
            showNotification('Complaint deleted successfully!', 'success');
            setDeleteConfirmComplaint(null);
            setShowModal(false);
            fetchComplaints();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to delete complaint', 'error');
        } finally {
            setIsDeletingComplaint(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { color: '#f59e0b', bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fff7ed', border: '#fde68a' };
            case 'in progress': return { color: isDark ? '#60a5fa' : '#1e3a8a', bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', border: '#bfdbfe' };
            case 'resolved': return { color: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#f0fdf4', border: '#bbf7d0' };
            case 'closed': return { color: colors.textSecondary, bg: isDark ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9', border: colors.cardBorder };
            default: return { color: colors.textSecondary, bg: colors.inputBg, border: colors.cardBorder };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                    pressed && [styles.cardPressed, { borderColor: colors.navy }]
                ]}
                onPress={() => handleOpenDetails(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {item.reopenRequest?.status === 'Pending' && (
                            <View style={styles.unlockBadge}>
                                <Text style={styles.unlockBadgeText}>⚠️ Unlock Requested</Text>
                            </View>
                        )}
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>Category: {item.type || 'General'} • Priority: {item.priority || 'Medium'}</Text>

                <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
                    <View style={styles.locationRow}>
                        <MapPin size={13} color={colors.textSecondary} />
                        <Text style={[styles.locationText, { color: colors.textSecondary }]}>{item.location || 'N/A'} {item.roomNo ? `(Room ${item.roomNo})` : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                            📅 {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        {item.assignedTo && (
                            <Text style={[styles.assignedToText, { color: isDark ? colors.gold : colors.navy }]}>👤 {item.assignedTo.name}</Text>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <Layout
            title={user.role === 'USER' ? t('my_tickets') : t('support_queue')}
            subtitle={t('manage_track_subtitle')}
            navigation={navigation}
            currentRoute="ComplaintsList"
        >
            <View style={styles.container}>
                {statusBanner && (
                    <View style={[styles.alertBanner, { backgroundColor: statusBanner.type === 'error' ? '#ef4444' : (statusBanner.type === 'info' ? '#3b82f6' : '#10b981') }]}>
                        <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}
                {/* Search Bar */}
                <View style={[styles.searchWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                    <Search size={18} color={isDark ? colors.gold : colors.navy} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        placeholder={t('search_complaints_placeholder')}
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
                    {['All', 'Pending', 'In Progress', 'Resolved', 'Closed'].map(st => (
                        <TouchableOpacity
                            key={st}
                            style={[
                                styles.filterPill,
                                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                                statusFilter === st && { backgroundColor: colors.navy, borderColor: colors.navy }
                            ]}
                            onPress={() => setStatusFilter(st)}
                        >
                            <Text style={[styles.filterText, { color: colors.textSecondary }, statusFilter === st && styles.filterTextActive]}>{st}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* List */}
                {loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                ) : (
                    <FlatList
                        data={filteredComplaints}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('no_tickets_found')}</Text>
                            </View>
                        }
                    />
                )}

                {/* Detail Modal */}
                {showModal && selectedComplaint && (
                    <Modal visible animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
                        >
                            <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('detail_modal_title')}</Text>
                                    <TouchableOpacity onPress={() => setShowModal(false)}>
                                        <X size={22} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ maxHeight: 450 }} keyboardShouldPersistTaps="handled">
                                    <Text style={[styles.modalSubTitle, { color: colors.textPrimary }]}>{selectedComplaint.title}</Text>
                                    <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedComplaint.description}</Text>

                                    <View style={[styles.infoGrid, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }]}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.type}</Text></Text>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Status: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.status}</Text></Text>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Priority: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.priority}</Text></Text>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.location || 'N/A'} {selectedComplaint.roomNo ? `- Rm ${selectedComplaint.roomNo}` : ''}</Text></Text>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Department: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.department || 'N/A'}</Text></Text>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Assigned Staff: <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{selectedComplaint.assignedTo?.name || 'Unassigned'}</Text></Text>
                                    </View>

                                    {/* Staff / Admin Actions */}
                                    {(isAdmin || user.role === 'STAFF') && (
                                        <View style={[styles.actionSection, { borderTopColor: colors.cardBorder }]}>
                                            <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Ticket Status & Actions</Text>

                                            {/* Admin Pending Staff Unlock Request Box */}
                                            {isAdmin && selectedComplaint.reopenRequest?.status === 'Pending' && (
                                                <View style={styles.adminApprovalCard}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                        <AlertCircle size={18} color="#d97706" />
                                                        <Text style={styles.adminApprovalTitle}>Staff Requested Ticket Unlock</Text>
                                                    </View>
                                                    <Text style={styles.adminApprovalDesc}>
                                                        Staff {selectedComplaint.reopenRequest?.requestedBy?.name || selectedComplaint.assignedTo?.name || 'Staff Member'} requested permission to edit this resolved ticket.
                                                    </Text>
                                                    {selectedComplaint.reopenRequest?.reason ? (
                                                        <Text style={styles.adminApprovalReason}>
                                                            Reason: "{selectedComplaint.reopenRequest.reason}"
                                                        </Text>
                                                    ) : null}
                                                    <View style={styles.approvalBtnRow}>
                                                        <TouchableOpacity
                                                            style={styles.approveUnlockBtn}
                                                            onPress={handleApproveUnlock}
                                                            disabled={updatingStatus}
                                                        >
                                                            <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                                            <Text style={styles.approveUnlockBtnText}>Approve & Unlock (In Progress)</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={styles.rejectUnlockBtn}
                                                            onPress={handleRejectUnlock}
                                                            disabled={updatingStatus}
                                                        >
                                                            <X size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                                            <Text style={styles.rejectUnlockBtnText}>Decline</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Staff Locked Box for Resolved / Closed Tickets */}
                                            {!isAdmin && (selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed') ? (
                                                <View style={styles.lockedStaffBox}>
                                                    {selectedComplaint.reopenRequest?.status === 'Pending' ? (
                                                        <View style={styles.lockedNoticeRow}>
                                                            <Clock size={22} color="#d97706" style={{ marginRight: 10, marginTop: 2 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.lockedTitle}>Unlock Request Pending Admin Approval</Text>
                                                                <Text style={styles.lockedDesc}>
                                                                    Your unlock request has been submitted. You can modify this complaint once an Admin approves it.
                                                                </Text>
                                                                {selectedComplaint.reopenRequest?.reason ? (
                                                                    <Text style={styles.lockedReasonText}>Reason: "{selectedComplaint.reopenRequest.reason}"</Text>
                                                                ) : null}
                                                            </View>
                                                        </View>
                                                    ) : (
                                                        <View style={styles.lockedNoticeRow}>
                                                            <Lock size={22} color="#1e3a8a" style={{ marginRight: 10, marginTop: 2 }} />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.lockedTitle}>Complaint Resolved & Locked</Text>
                                                                <Text style={styles.lockedDesc}>
                                                                    This work has been marked as Resolved. To modify or change this complaint, you must submit an unlock request to the Admin.
                                                                </Text>
                                                                {selectedComplaint.reopenRequest?.status === 'Rejected' && (
                                                                    <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, fontWeight: 'bold' }}>
                                                                        Previous request was declined by Admin.
                                                                    </Text>
                                                                )}
                                                                <TouchableOpacity
                                                                    style={styles.requestUnlockBtn}
                                                                    onPress={() => setShowUnlockModal(true)}
                                                                >
                                                                    <Key size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                                                    <Text style={styles.requestUnlockBtnText}>Request Admin to Unlock Ticket</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <>
                                                    <TextInput
                                                        style={[styles.noteInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                                        placeholder="Add update note (optional)..."
                                                        placeholderTextColor="#94a3b8"
                                                        value={statusNote}
                                                        onChangeText={setStatusNote}
                                                    />
                                                    <View style={styles.statusBtnRow}>
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: '#d97706' }]}
                                                            onPress={() => handleUpdateStatus('Pending')}
                                                            disabled={updatingStatus}
                                                        >
                                                            <Text style={styles.statusBtnText}>Pending</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: '#1e3a8a' }]}
                                                            onPress={() => handleUpdateStatus('In Progress')}
                                                            disabled={updatingStatus}
                                                        >
                                                            <Text style={styles.statusBtnText}>In Progress</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.statusBtn, { backgroundColor: '#16a34a' }]}
                                                            onPress={() => handleUpdateStatus('Resolved')}
                                                            disabled={updatingStatus}
                                                        >
                                                            <Text style={styles.statusBtnText}>Resolved</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </>
                                            )}

                                            {isAdmin && staffList.length > 0 && (
                                                <View style={{ marginTop: 14 }}>
                                                    <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Assign Technical Staff</Text>
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                                        {staffList.map(st => (
                                                            <TouchableOpacity
                                                                key={st._id}
                                                                style={[styles.staffChip, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }, selectedStaffId === st._id && styles.staffChipActive]}
                                                                onPress={() => setSelectedStaffId(st._id)}
                                                            >
                                                                <Text style={[styles.staffChipText, { color: colors.textSecondary }, selectedStaffId === st._id && styles.staffChipTextActive]}>
                                                                    {st.name} ({st.role})
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                    <TouchableOpacity style={styles.assignBtn} onPress={handleAssignStaff} disabled={updatingStatus}>
                                                        <UserCheck size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                                        <Text style={styles.assignBtnText}>Assign Staff Member</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* User Rating Section for Resolved Tickets */}
                                    {user.role === 'USER' && (selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed') && (
                                        <View style={[styles.ratingSection, { borderTopColor: colors.cardBorder }]}>
                                            <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Rate Service Resolution</Text>
                                            <View style={styles.starRow}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                                                        <Star size={24} color={star <= userRating ? '#f59e0b' : '#cbd5e1'} fill={star <= userRating ? '#f59e0b' : 'none'} />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                            <TextInput
                                                style={[styles.noteInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                                placeholder="Provide feedback..."
                                                placeholderTextColor="#94a3b8"
                                                value={userFeedback}
                                                onChangeText={setUserFeedback}
                                            />
                                            <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitFeedback}>
                                                <Text style={styles.submitRatingText}>Submit Feedback</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </ScrollView>

                                {isAdmin && (
                                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteConfirmComplaint(selectedComplaint)}>
                                        <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                        <Text style={styles.deleteBtnText}>Delete Ticket</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                )}

                {/* Staff Unlock Request Modal */}
                {showUnlockModal && selectedComplaint && (
                    <Modal visible animationType="fade" transparent onRequestClose={() => setShowUnlockModal(false)}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
                        >
                            <View style={[styles.unlockModalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                                <View style={styles.unlockModalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Key size={20} color={colors.navy} />
                                        <Text style={[styles.unlockModalTitle, { color: colors.textPrimary }]}>Request Admin Unlock</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setShowUnlockModal(false)}>
                                        <X size={20} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.unlockModalSubtitle, { color: colors.textSecondary }]}>
                                    Ticket "{selectedComplaint.title}" is currently resolved. Please state why this ticket needs to be unlocked for modifications.
                                </Text>
                                <TextInput
                                    style={[styles.unlockInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                    placeholder="Enter reason (e.g. Issue recurred, additional parts needed)..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    numberOfLines={3}
                                    value={unlockReason}
                                    onChangeText={setUnlockReason}
                                />
                                <View style={styles.unlockActionRow}>
                                    <TouchableOpacity
                                        style={[styles.cancelUnlockBtn, { borderColor: colors.cardBorder }]}
                                        onPress={() => setShowUnlockModal(false)}
                                    >
                                        <Text style={[styles.cancelUnlockText, { color: colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.submitUnlockBtn}
                                        onPress={handleRequestUnlock}
                                        disabled={submittingUnlock}
                                    >
                                        {submittingUnlock ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.submitUnlockBtnText}>Send Request to Admin</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                )}

                {/* Custom Delete Confirmation Dialog Modal */}
                {deleteConfirmComplaint && (
                    <Modal visible animationType="fade" transparent onRequestClose={() => setDeleteConfirmComplaint(null)}>
                        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.65)' }]}>
                            <View style={[styles.confirmDialogCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                                <View style={styles.confirmIconCircle}>
                                    <Trash2 size={28} color="#ef4444" />
                                </View>
                                <Text style={[styles.confirmDialogTitle, { color: colors.textPrimary }]}>
                                    Delete Complaint Record?
                                </Text>
                                <Text style={[styles.confirmDialogDesc, { color: colors.textSecondary }]}>
                                    Are you sure you want to permanently delete{' '}
                                    <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                                        "{deleteConfirmComplaint.title}"
                                    </Text>
                                    ? This action cannot be undone.
                                </Text>
                                <View style={styles.confirmDialogActions}>
                                    <TouchableOpacity
                                        style={[styles.confirmCancelBtn, { borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}
                                        onPress={() => setDeleteConfirmComplaint(null)}
                                        disabled={isDeletingComplaint}
                                    >
                                        <Text style={[styles.confirmCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.confirmDeleteBtn,
                                            pressed && { opacity: 0.8 },
                                            isDeletingComplaint && { opacity: 0.6 }
                                        ]}
                                        onPress={confirmDeleteComplaint}
                                        disabled={isDeletingComplaint}
                                    >
                                        {isDeletingComplaint ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.confirmDeleteBtnText}>Delete Ticket</Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
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
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 46,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0f172a',
        borderWidth: 0,
    },
    filterScroll: {
        maxHeight: 40,
        marginBottom: 16,
    },
    filterContainer: {
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    filterText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    cardPressed: {
        borderColor: '#1e3a8a',
        transform: [{ scale: 0.99 }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    cardMeta: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 12,
        color: '#94a3b8',
        marginLeft: 4,
    },
    assignedToText: {
        fontSize: 11,
        color: '#1e3a8a',
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    modalOverlay: {
        ...(Platform.OS === 'web' ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        } : {
            flex: 1,
        }),
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 9999,
    },
    modalContent: {
        width: '100%',
        maxWidth: 620,
        alignSelf: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    modalSubTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    modalDesc: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 14,
        lineHeight: 20,
    },
    infoGrid: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 12,
        marginBottom: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    infoVal: {
        color: '#0f172a',
        fontWeight: 'bold',
    },
    actionSection: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 12,
        marginTop: 10,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    noteInput: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        marginBottom: 10,
        color: '#0f172a',
    },
    statusBtnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flex: 1,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    staffChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    staffChipActive: {
        backgroundColor: '#d97706',
        borderColor: '#d97706',
    },
    staffChipText: {
        fontSize: 12,
        color: '#475569',
    },
    staffChipTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    assignBtn: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        borderRadius: 10,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
    },
    assignBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    ratingSection: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 12,
        marginTop: 12,
    },
    starRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    submitRatingBtn: {
        backgroundColor: '#16a34a',
        borderRadius: 10,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitRatingText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    deleteBtn: {
        flexDirection: 'row',
        backgroundColor: '#ef4444',
        borderRadius: 10,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
    },
    deleteBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
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
    },
    unlockBadge: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    unlockBadgeText: {
        color: '#b45309',
        fontSize: 10,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    adminApprovalCard: {
        backgroundColor: '#fffbeb',
        borderColor: '#fcd34d',
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    adminApprovalTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#b45309',
    },
    adminApprovalDesc: {
        fontSize: 12,
        color: '#78350f',
        marginTop: 2,
        lineHeight: 18,
    },
    adminApprovalReason: {
        fontSize: 12,
        color: '#92400e',
        fontStyle: 'italic',
        marginTop: 4,
        padding: 6,
        backgroundColor: '#fef3c7',
        borderRadius: 6,
    },
    approvalBtnRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    approveUnlockBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        borderRadius: 8,
        height: 38,
        paddingHorizontal: 8,
    },
    approveUnlockBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    rejectUnlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 8,
        height: 38,
        paddingHorizontal: 12,
    },
    rejectUnlockBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    lockedStaffBox: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 14,
        marginTop: 6,
    },
    lockedNoticeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    lockedTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    lockedDesc: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 4,
        lineHeight: 18,
    },
    lockedReasonText: {
        fontSize: 12,
        color: '#d97706',
        fontStyle: 'italic',
        marginTop: 6,
        backgroundColor: '#fef3c7',
        padding: 6,
        borderRadius: 6,
    },
    requestUnlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e3a8a',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginTop: 12,
    },
    requestUnlockBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    unlockModalCard: {
        width: '90%',
        maxWidth: 480,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    unlockModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    unlockModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    unlockModalSubtitle: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    unlockInput: {
        borderWidth: 1.5,
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        minHeight: 70,
        textAlignVertical: 'top',
        marginBottom: 14,
    },
    unlockActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    cancelUnlockBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelUnlockText: {
        fontSize: 13,
        fontWeight: '600',
    },
    submitUnlockBtn: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitUnlockBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    confirmDialogCard: {
        width: '90%',
        maxWidth: 420,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 1,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
    },
    confirmIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmDialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmDialogDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
    },
    confirmDialogActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmCancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmDeleteBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmDeleteBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default ComplaintsList;
