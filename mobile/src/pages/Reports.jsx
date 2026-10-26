import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import storage from '../utils/storage';
import {
    FileText,
    Eye,
    X,
    FilePlus,
    CheckCircle2,
    Search,
    User,
    Mail,
    Building2,
    GraduationCap,
    Trash2,
    ChevronDown,
    ChevronUp,
    Phone,
    Shield,
    Ticket,
    Check,
    Download
} from 'lucide-react-native';

const Reports = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Admin generator state
    const [allUsers, setAllUsers] = useState([]);
    const [allComplaints, setAllComplaints] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [reportTitle, setReportTitle] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [selectedComplaintId, setSelectedComplaintId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // View & Delete Modal state
    const [selectedReport, setSelectedReport] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [deleteConfirmReport, setDeleteConfirmReport] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statusBanner, setStatusBanner] = useState(null);

    const userStr = storage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : {};
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => setStatusBanner(null), 4000);
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const endpoint = isAdmin ? '/api/reports/all' : '/api/reports/my-reports';
            const res = await api.get(endpoint);
            setReports(res.data || []);
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser.role === 'STAFF') {
            navigation.navigate('Dashboard');
        }
    }, [currentUser.role]);

    const fetchAdminData = async () => {
        if (!isAdmin) return;
        try {
            const [usersRes, complaintsRes] = await Promise.all([
                api.get('/api/auth/users'),
                api.get('/api/complaints')
            ]);
            setAllUsers(usersRes.data || []);
            setAllComplaints(complaintsRes.data || []);
        } catch (err) {
            console.error('Failed to load users or complaints for report generator:', err);
        }
    };

    useEffect(() => {
        fetchReports();
        if (isAdmin) {
            fetchAdminData();
        }
    }, [isAdmin]);

    // Handle user selection in generator
    const handleSelectUser = (userItem) => {
        setSelectedUser(userItem);
        setIsUserDropdownOpen(false);
        setUserSearchQuery('');
        setReportTitle(`Official Report - ${userItem.name} (${userItem.department || 'TMS'})`);

        // Check if user has complaints
        const userComps = allComplaints.filter(c =>
            (c.raisedBy?._id === userItem._id) || (c.raisedBy === userItem._id)
        );
        if (userComps.length > 0) {
            setSelectedComplaintId(userComps[0]._id);
        } else {
            setSelectedComplaintId('');
        }
    };

    // Filter users in dropdown
    const filteredUsers = allUsers.filter(u => {
        if (!userSearchQuery) return true;
        const q = userSearchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q))
        );
    });

    // Complaints raised by the currently selected user
    const selectedUserComplaints = selectedUser ? allComplaints.filter(c =>
        (c.raisedBy?._id === selectedUser._id) || (c.raisedBy === selectedUser._id)
    ) : [];

    // Filter reports in main list
    const filteredReports = reports.filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const titleMatch = r.title && r.title.toLowerCase().includes(q);
        const recipientNameMatch = r.recipient?.name && r.recipient.name.toLowerCase().includes(q);
        const recipientEmailMatch = r.recipient?.email && r.recipient.email.toLowerCase().includes(q);
        const categoryMatch = r.complaint?.type && r.complaint.type.toLowerCase().includes(q);
        const deptMatch = r.department && r.department.toLowerCase().includes(q);
        const statusMatch = r.status && r.status.toLowerCase().includes(q);
        return titleMatch || recipientNameMatch || recipientEmailMatch || categoryMatch || deptMatch || statusMatch;
    });

    const handleGenerateReport = async () => {
        if (!selectedUser) {
            showNotification('Please select a recipient user from the dropdown.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/api/reports', {
                title: reportTitle.trim() || `Official Report - ${selectedUser.name}`,
                recipientId: selectedUser._id,
                recipientEmail: selectedUser.email,
                complaintId: selectedComplaintId || undefined,
                description: reportDescription.trim()
            });

            showNotification(`Report generated & dispatched to ${selectedUser.name}!`, 'success');
            setIsCreateModalOpen(false);
            setSelectedUser(null);
            setReportTitle('');
            setReportDescription('');
            setSelectedComplaintId('');
            fetchReports();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to generate report', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteReport = async () => {
        if (!deleteConfirmReport) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/reports/${deleteConfirmReport._id}`);
            showNotification('Report deleted successfully!', 'success');
            setDeleteConfirmReport(null);
            if (selectedReport?._id === deleteConfirmReport._id) {
                setIsViewModalOpen(false);
                setSelectedReport(null);
            }
            fetchReports();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Failed to delete report', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownloadReport = (report) => {
        if (!report) return;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${report.title} - Official TMS Report</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 30px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .logo-title {
            font-size: 24px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
        }
        .subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
        }
        .badge-official {
            background-color: #dbeafe;
            color: #1e40af;
            font-weight: 800;
            font-size: 11px;
            padding: 6px 14px;
            border-radius: 9999px;
            border: 1px solid #bfdbfe;
            text-transform: uppercase;
        }
        .report-title-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #1e3a8a;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        .report-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 6px 0;
        }
        .report-meta {
            font-size: 13px;
            color: #64748b;
        }
        .section-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
        }
        .section-header {
            background: #f1f5f9;
            padding: 10px 16px;
            font-size: 12px;
            font-weight: 800;
            color: #1e3a8a;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }
        .section-body {
            padding: 16px;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
        }
        .field-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
        }
        .field-value {
            font-size: 14px;
            color: #0f172a;
            font-weight: 600;
            margin-top: 2px;
        }
        .findings-text {
            font-size: 14px;
            color: #334155;
            line-height: 1.7;
            white-space: pre-line;
            background: #ffffff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #f1f5f9;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stamp {
            border: 2px solid #16a34a;
            color: #16a34a;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 12px;
            text-transform: uppercase;
            display: inline-block;
        }
        .signature-line {
            text-align: right;
            font-size: 12px;
            color: #64748b;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="logo-title">TMS INSTITUTIONAL AUDIT PORTAL</h1>
            <div class="subtitle">Ticket & Resolution Management System • Official Record</div>
        </div>
        <div class="badge-official">VERIFIED DOCUMENT</div>
    </div>

    <div class="report-title-card">
        <h2 class="report-title">${report.title}</h2>
        <div class="report-meta">
            Document ID: #${report._id} &bull; Generated: ${new Date(report.createdAt).toLocaleString()}
        </div>
    </div>

    <div class="section-box">
        <div class="section-header">RECIPIENT & PROFILE DETAILS</div>
        <div class="section-body grid-2">
            <div>
                <div class="field-label">Recipient Full Name</div>
                <div class="field-value">${report.recipient?.name || 'N/A'}</div>
            </div>
            <div>
                <div class="field-label">Official Email</div>
                <div class="field-value">${report.recipient?.email || 'N/A'}</div>
            </div>
            <div>
                <div class="field-label">Department / School</div>
                <div class="field-value">${report.department || report.recipient?.department || 'General'}</div>
            </div>
            <div>
                <div class="field-label">Programme / Degree</div>
                <div class="field-value">${report.programme || report.recipient?.programme || 'N/A'}</div>
            </div>
        </div>
    </div>

    ${report.complaint ? `
    <div class="section-box">
        <div class="section-header">ASSOCIATED COMPLAINT RECORD</div>
        <div class="section-body grid-2">
            <div>
                <div class="field-label">Ticket Title</div>
                <div class="field-value">${report.complaint.title || 'N/A'}</div>
            </div>
            <div>
                <div class="field-label">Category / Issue Type</div>
                <div class="field-value">${report.complaint.type || 'N/A'}</div>
            </div>
            <div>
                <div class="field-label">Resolution Status</div>
                <div class="field-value" style="color: #16a34a;">${report.complaint.status || 'Resolved'}</div>
            </div>
            <div>
                <div class="field-label">Location / Room</div>
                <div class="field-value">${report.complaint.location || ''} ${report.complaint.block ? `(${report.complaint.block})` : ''} ${report.complaint.roomNo ? `Room: ${report.complaint.roomNo}` : ''}</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${report.description ? `
    <div class="section-box">
        <div class="section-header">RESOLUTION NOTES & FINDINGS</div>
        <div class="section-body">
            <div class="findings-text">${report.description}</div>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div class="stamp">
            &#10004; VERIFIED & AUTHENTICATED
        </div>
        <div class="signature-line">
            <div>Issued By: <strong>${report.generatedBy?.name || 'TMS Administration'}</strong></div>
            <div>Verification Code: ${report._id.substring(0, 10).toUpperCase()}</div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>
            `;

            // Open printable window for PDF save
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(reportHtml);
                printWindow.document.close();
            }

            // Also trigger direct HTML file download
            try {
                const blob = new Blob([reportHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(report.title || 'Official_Report').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error(err);
            }

            showNotification('Report document prepared for download & print!', 'success');
        } else {
            showNotification('Report downloaded successfully!', 'success');
        }
    };

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    const renderItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                cardDynamicStyle,
                pressed && [styles.cardPressed, { borderColor: colors.navy }]
            ]}
            onPress={() => { setSelectedReport(item); setIsViewModalOpen(true); }}
        >
            <View style={styles.cardLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', borderColor: colors.cardBorder }]}>
                    <FileText size={22} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.date}>
                            📅 {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                        {item.recipient?.name && (
                            <Text style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.3)' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e40af' }]}>
                                👤 {item.recipient.name}
                            </Text>
                        )}
                        {(item.department || item.recipient?.department) && (
                            <Text style={[styles.metaPill, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7', color: isDark ? '#fcd34d' : '#b45309' }]}>
                                🏢 {item.department || item.recipient?.department}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        handleDownloadReport(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Download size={18} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => { setSelectedReport(item); setIsViewModalOpen(true); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Eye size={18} color="#f59e0b" />
                </TouchableOpacity>
                {isAdmin && (
                    <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => setDeleteConfirmReport(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>
        </Pressable>
    );

    return (
        <Layout
            title={isAdmin ? 'Management Reports' : t('system_reports')}
            subtitle={isAdmin ? 'Generate, dispatch and review verified official documents.' : 'Access and review your official resolution records.'}
            navigation={navigation}
            currentRoute="Reports"
        >
            <View style={styles.container}>
                {statusBanner && (
                    <View style={[styles.alertBanner, statusBanner.type === 'error' && { backgroundColor: '#ef4444' }]}>
                        <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Top Action Bar (Admin: Generate Button) */}
                {isAdmin && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.generateBtn}
                            onPress={() => {
                                setIsCreateModalOpen(true);
                                setSelectedUser(null);
                                setReportTitle('');
                                setReportDescription('');
                                setSelectedComplaintId('');
                            }}
                        >
                            <FilePlus size={18} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateBtnText}>Generate New Report</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Search Bar */}
                <View style={[styles.searchBarWrapper, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <Search size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        placeholder="Search reports by title, recipient, department, or status..."
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                            <X size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Reports List */}
                {loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                ) : (
                    <FlatList
                        data={filteredReports}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <FileText size={48} color={isDark ? '#334155' : '#cbd5e1'} style={{ marginBottom: 12 }} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {searchQuery.trim() ? 'No reports matched your search.' : 'No official reports found.'}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Create Report Modal */}
                {isCreateModalOpen && (
                    <Modal visible animationType="slide" transparent onRequestClose={() => setIsCreateModalOpen(false)}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
                        >
                            <View style={[styles.modalContent, cardDynamicStyle, { borderWidth: 1 }]}>
                                <View style={styles.modalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <FilePlus size={22} color={colors.navy} />
                                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Generate Official Report</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                                        <X size={22} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                    {/* User Selection Dropdown Label */}
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                                        Select Recipient User <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>

                                    {/* User Dropdown Selector Box */}
                                    <TouchableOpacity
                                        style={[
                                            styles.dropdownBox,
                                            { backgroundColor: colors.inputBg, borderColor: selectedUser ? colors.navy : colors.inputBorder }
                                        ]}
                                        onPress={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                                            <User size={18} color={selectedUser ? colors.navy : colors.textSecondary} />
                                            {selectedUser ? (
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.selectedUserText, { color: colors.textPrimary }]}>
                                                        {selectedUser.name} ({selectedUser.email})
                                                    </Text>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                                        {selectedUser.role} • {selectedUser.department || 'General'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                                    Click to choose a user from dropdown...
                                                </Text>
                                            )}
                                        </View>
                                        {isUserDropdownOpen ? (
                                            <ChevronUp size={20} color={colors.textSecondary} />
                                        ) : (
                                            <ChevronDown size={20} color={colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>

                                    {/* Expanded User Dropdown Menu with Search */}
                                    {isUserDropdownOpen && (
                                        <View style={[styles.userDropdownMenu, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                                            <View style={[styles.menuSearchBox, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }]}>
                                                <Search size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                                <TextInput
                                                    style={[styles.menuSearchInput, { color: colors.textPrimary }]}
                                                    placeholder="Search user by name, email, dept..."
                                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                                    value={userSearchQuery}
                                                    onChangeText={setUserSearchQuery}
                                                />
                                                {userSearchQuery.length > 0 && (
                                                    <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                                                        <X size={14} color={colors.textSecondary} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                                                {filteredUsers.length === 0 ? (
                                                    <View style={{ padding: 12, alignItems: 'center' }}>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>No users found.</Text>
                                                    </View>
                                                ) : (
                                                    filteredUsers.map(u => (
                                                        <TouchableOpacity
                                                            key={u._id}
                                                            style={[
                                                                styles.userMenuItem,
                                                                { borderBottomColor: colors.cardBorder },
                                                                selectedUser?._id === u._id && { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : '#eff6ff' }
                                                            ]}
                                                            onPress={() => handleSelectUser(u)}
                                                        >
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.userMenuName, { color: colors.textPrimary }]}>
                                                                    {u.name}
                                                                </Text>
                                                                <Text style={[styles.userMenuEmail, { color: colors.textSecondary }]}>
                                                                    {u.email}
                                                                </Text>
                                                            </View>
                                                            <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                                                <Text style={[styles.roleBadge, { backgroundColor: u.role === 'ADMIN' ? '#d97706' : '#1e3a8a' }]}>
                                                                    {u.role}
                                                                </Text>
                                                                {u.department && (
                                                                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                                                                        {u.department}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                    ))
                                                )}
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* Selected User Details Card */}
                                    {selectedUser && (
                                        <View style={[styles.userDetailsCard, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.15)' : '#f8fafc', borderColor: colors.cardBorder }]}>
                                            <View style={styles.userDetailHeader}>
                                                <View style={styles.avatarCircle}>
                                                    <Text style={styles.avatarText}>
                                                        {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={[styles.detailUserName, { color: colors.textPrimary }]}>
                                                        {selectedUser.name}
                                                    </Text>
                                                    <Text style={[styles.detailUserEmail, { color: colors.textSecondary }]}>
                                                        {selectedUser.email}
                                                    </Text>
                                                </View>
                                                <View style={styles.verifiedBadge}>
                                                    <Check size={12} color="#ffffff" style={{ marginRight: 2 }} />
                                                    <Text style={styles.verifiedText}>Active User</Text>
                                                </View>
                                            </View>

                                            <View style={styles.detailGrid}>
                                                <View style={styles.detailItem}>
                                                    <Building2 size={14} color={colors.navy} />
                                                    <Text style={[styles.detailItemText, { color: colors.textSecondary }]}>
                                                        Dept: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedUser.department || 'Not Assigned'}</Text>
                                                    </Text>
                                                </View>

                                                <View style={styles.detailItem}>
                                                    <GraduationCap size={14} color={colors.gold} />
                                                    <Text style={[styles.detailItemText, { color: colors.textSecondary }]}>
                                                        Prog: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedUser.programme || 'General'}</Text>
                                                    </Text>
                                                </View>

                                                {selectedUser.phoneNumber ? (
                                                    <View style={styles.detailItem}>
                                                        <Phone size={14} color="#10b981" />
                                                        <Text style={[styles.detailItemText, { color: colors.textSecondary }]}>
                                                            Phone: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedUser.phoneNumber}</Text>
                                                        </Text>
                                                    </View>
                                                ) : null}

                                                <View style={styles.detailItem}>
                                                    <Ticket size={14} color="#d97706" />
                                                    <Text style={[styles.detailItemText, { color: colors.textSecondary }]}>
                                                        Total Tickets: <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{selectedUserComplaints.length}</Text>
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Link Complaint (Optional) */}
                                            {selectedUserComplaints.length > 0 && (
                                                <View style={{ marginTop: 12 }}>
                                                    <Text style={[styles.label, { color: colors.textSecondary, fontSize: 12 }]}>
                                                        Attach Specific Ticket (Optional):
                                                    </Text>
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.compChip,
                                                                { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                                !selectedComplaintId && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }
                                                            ]}
                                                            onPress={() => setSelectedComplaintId('')}
                                                        >
                                                            <Text style={[styles.compChipText, { color: colors.textSecondary }, !selectedComplaintId && { color: '#ffffff', fontWeight: 'bold' }]}>
                                                                All / General User Summary
                                                            </Text>
                                                        </TouchableOpacity>
                                                        {selectedUserComplaints.map(c => (
                                                            <TouchableOpacity
                                                                key={c._id}
                                                                style={[
                                                                    styles.compChip,
                                                                    { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                                    selectedComplaintId === c._id && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }
                                                                ]}
                                                                onPress={() => setSelectedComplaintId(c._id)}
                                                            >
                                                                <Text style={[styles.compChipText, { color: colors.textSecondary }, selectedComplaintId === c._id && { color: '#ffffff', fontWeight: 'bold' }]}>
                                                                    {c.title} ({c.status})
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Report Title Input */}
                                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 14 }]}>
                                        Report Title <Text style={{ color: '#ef4444' }}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                        placeholder="e.g. Performance & Resolution Summary Report"
                                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                        value={reportTitle}
                                        onChangeText={setReportTitle}
                                    />

                                    {/* Report Notes / Description */}
                                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
                                        Official Notes / Findings
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            styles.textArea,
                                            { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }
                                        ]}
                                        placeholder="Enter official resolution details, findings, or administrative remarks..."
                                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                        value={reportDescription}
                                        onChangeText={setReportDescription}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </ScrollView>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.submitGenBtn,
                                        pressed && styles.submitGenBtnPressed,
                                        submitting && { opacity: 0.7 }
                                    ]}
                                    onPress={handleGenerateReport}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#ffffff" size="small" />
                                    ) : (
                                        <Text style={styles.submitGenBtnText}>Confirm & Generate Report</Text>
                                    )}
                                </Pressable>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                )}

                {/* View Report Modal */}
                {isViewModalOpen && selectedReport && (
                    <Modal visible animationType="slide" transparent onRequestClose={() => setIsViewModalOpen(false)}>
                        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                            <View style={[styles.modalContent, cardDynamicStyle, { borderWidth: 1 }]}>
                                <View style={styles.modalHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <FileText size={22} color={colors.navy} />
                                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Official Document</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                                        <X size={22} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                                    <View style={[styles.reportDocHeader, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.2)' : '#eff6ff', borderColor: colors.cardBorder }]}>
                                        <View style={styles.stampBadge}>
                                            <Shield size={14} color="#1e3a8a" />
                                            <Text style={styles.stampText}>OFFICIAL TMS REPORT</Text>
                                        </View>
                                        <Text style={[styles.reportDocTitle, { color: colors.textPrimary }]}>
                                            {selectedReport.title}
                                        </Text>
                                        <Text style={styles.reportDocDate}>
                                            Generated On: {new Date(selectedReport.createdAt).toLocaleString()}
                                        </Text>
                                    </View>

                                    {/* Recipient Details */}
                                    <View style={[styles.docSection, { borderColor: colors.cardBorder }]}>
                                        <Text style={[styles.docSectionHeader, { color: colors.navy }]}>RECIPIENT INFORMATION</Text>
                                        <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Name: </Text>
                                            {selectedReport.recipient?.name || 'N/A'}
                                        </Text>
                                        <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Email: </Text>
                                            {selectedReport.recipient?.email || 'N/A'}
                                        </Text>
                                        <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                            <Text style={{ fontWeight: 'bold' }}>Department: </Text>
                                            {selectedReport.department || selectedReport.recipient?.department || 'General'}
                                        </Text>
                                        {selectedReport.programme || selectedReport.recipient?.programme ? (
                                            <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                                <Text style={{ fontWeight: 'bold' }}>Programme: </Text>
                                                {selectedReport.programme || selectedReport.recipient?.programme}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Associated Ticket Information */}
                                    {selectedReport.complaint ? (
                                        <View style={[styles.docSection, { borderColor: colors.cardBorder }]}>
                                            <Text style={[styles.docSectionHeader, { color: colors.gold }]}>ASSOCIATED COMPLAINT RECORD</Text>
                                            <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                                <Text style={{ fontWeight: 'bold' }}>Title: </Text>
                                                {selectedReport.complaint.title}
                                            </Text>
                                            <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                                <Text style={{ fontWeight: 'bold' }}>Category: </Text>
                                                {selectedReport.complaint.type}
                                            </Text>
                                            <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                                <Text style={{ fontWeight: 'bold' }}>Status: </Text>
                                                {selectedReport.complaint.status}
                                            </Text>
                                            {selectedReport.complaint.location ? (
                                                <Text style={[styles.docText, { color: colors.textPrimary }]}>
                                                    <Text style={{ fontWeight: 'bold' }}>Location: </Text>
                                                    {selectedReport.complaint.location} {selectedReport.complaint.block ? `(${selectedReport.complaint.block})` : ''} {selectedReport.complaint.roomNo ? `Room: ${selectedReport.complaint.roomNo}` : ''}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ) : null}

                                    {/* Description / Findings */}
                                    {selectedReport.description ? (
                                        <View style={[styles.docSection, { borderColor: colors.cardBorder }]}>
                                            <Text style={[styles.docSectionHeader, { color: colors.navy }]}>RESOLUTION & FINDINGS</Text>
                                            <Text style={[styles.docText, { color: colors.textSecondary, lineHeight: 22 }]}>
                                                {selectedReport.description}
                                            </Text>
                                        </View>
                                    ) : null}

                                    {/* Issuer Information */}
                                    <View style={[styles.docSection, { borderColor: colors.cardBorder, borderBottomWidth: 0 }]}>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                            Issued by: <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>{selectedReport.generatedBy?.name || 'TMS Administrator'}</Text> ({selectedReport.generatedBy?.email || 'admin@tms.com'})
                                        </Text>
                                    </View>
                                </ScrollView>

                                <View style={styles.docActions}>
                                    <TouchableOpacity
                                        style={styles.downloadDocBtn}
                                        onPress={() => handleDownloadReport(selectedReport)}
                                    >
                                        <Download size={16} color="#ffffff" style={{ marginRight: 6 }} />
                                        <Text style={styles.downloadDocBtnText}>Download / Print</Text>
                                    </TouchableOpacity>
                                    {isAdmin && (
                                        <TouchableOpacity
                                            style={styles.deleteDocBtn}
                                            onPress={() => setDeleteConfirmReport(selectedReport)}
                                        >
                                            <Trash2 size={16} color="#ef4444" style={{ marginRight: 6 }} />
                                            <Text style={styles.deleteDocBtnText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.closeBtn,
                                            pressed && styles.closeBtnPressed,
                                            { flex: 1 }
                                        ]}
                                        onPress={() => setIsViewModalOpen(false)}
                                    >
                                        <Text style={styles.closeBtnText}>Close</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmReport && (
                    <Modal visible animationType="fade" transparent onRequestClose={() => setDeleteConfirmReport(null)}>
                        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                            <View style={[styles.deleteModalCard, cardDynamicStyle, { borderWidth: 1 }]}>
                                <View style={styles.deleteIconCircle}>
                                    <Trash2 size={28} color="#ef4444" />
                                </View>
                                <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>
                                    Confirm Report Deletion
                                </Text>
                                <Text style={[styles.deleteModalDesc, { color: colors.textSecondary }]}>
                                    Are you sure you want to permanently delete{' '}
                                    <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                                        "{deleteConfirmReport.title}"
                                    </Text>
                                    ? This action cannot be reversed.
                                </Text>
                                <View style={styles.deleteModalActions}>
                                    <TouchableOpacity
                                        style={[styles.deleteCancelBtn, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }]}
                                        onPress={() => setDeleteConfirmReport(null)}
                                        disabled={isDeleting}
                                    >
                                        <Text style={[styles.deleteCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.deleteConfirmBtn,
                                            pressed && styles.btnPressed,
                                            isDeleting && { opacity: 0.7 }
                                        ]}
                                        onPress={confirmDeleteReport}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.deleteConfirmBtnText}>Delete Report</Text>
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
    actionRow: {
        marginBottom: 12,
    },
    generateBtn: {
        flexDirection: 'row',
        backgroundColor: '#1e3a8a',
        borderRadius: 14,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    generateBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 14,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
    },
    listContainer: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardPressed: {
        borderColor: '#1e3a8a',
        transform: [{ scale: 0.985 }],
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    date: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    metaPill: {
        fontSize: 11,
        fontWeight: '600',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    downloadBtn: {
        padding: 8,
    },
    viewBtn: {
        padding: 8,
    },
    trashBtn: {
        padding: 8,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 22,
        elevation: 10,
        maxWidth: 540,
        width: '100%',
        alignSelf: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    dropdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 50,
    },
    selectedUserText: {
        fontSize: 13,
        fontWeight: '600',
    },
    userDropdownMenu: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 6,
        marginBottom: 12,
        padding: 8,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    menuSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 38,
        marginBottom: 6,
    },
    menuSearchInput: {
        flex: 1,
        fontSize: 13,
    },
    userMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
    },
    userMenuName: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    userMenuEmail: {
        fontSize: 12,
    },
    roleBadge: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    userDetailsCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        marginBottom: 6,
    },
    userDetailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    detailUserName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    detailUserEmail: {
        fontSize: 12,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#16a34a',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    verifiedText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    detailGrid: {
        gap: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailItemText: {
        fontSize: 12,
    },
    compChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 6,
    },
    compChipText: {
        fontSize: 12,
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
    },
    textArea: {
        height: 80,
        paddingTop: 10,
        textAlignVertical: 'top',
    },
    submitGenBtn: {
        backgroundColor: '#16a34a',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
    },
    submitGenBtnPressed: {
        backgroundColor: '#15803d',
        transform: [{ scale: 0.985 }],
    },
    submitGenBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    reportDocHeader: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        alignItems: 'center',
    },
    stampBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 8,
    },
    stampText: {
        color: '#1e3a8a',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    reportDocTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    reportDocDate: {
        fontSize: 12,
        color: '#64748b',
    },
    docSection: {
        borderBottomWidth: 1,
        paddingVertical: 12,
        gap: 4,
    },
    docSectionHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    docText: {
        fontSize: 13,
        lineHeight: 18,
    },
    docActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 16,
    },
    downloadDocBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 16,
        elevation: 2,
    },
    downloadDocBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    deleteDocBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fca5a5',
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        height: 48,
        paddingHorizontal: 16,
    },
    deleteDocBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: 'bold',
    },
    closeBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    closeBtnPressed: {
        backgroundColor: '#1e40af',
        transform: [{ scale: 0.985 }],
    },
    closeBtnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
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
    deleteModalCard: {
        width: '90%',
        maxWidth: 380,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    deleteIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    deleteModalDesc: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    deleteModalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    deleteCancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    deleteCancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    deleteConfirmBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    deleteConfirmBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default Reports;
