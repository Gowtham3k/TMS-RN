import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView, Alert, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Search, UserPlus, Edit, Trash2, X, CheckCircle2 } from 'lucide-react-native';

const UsersList = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [statusBanner, setStatusBanner] = useState(null);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'USER',
        department: '', phoneNumber: '', programme: ''
    });

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => setStatusBanner(null), 4000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/auth/users');
            const data = res.data || [];
            setUsers(data);
            setFilteredUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const lower = searchQuery.toLowerCase();
        const filtered = users.filter(u =>
            (u.name && u.name.toLowerCase().includes(lower)) ||
            (u.email && u.email.toLowerCase().includes(lower)) ||
            (u.department && u.department.toLowerCase().includes(lower))
        );
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                role: user.role || 'USER',
                department: user.department || '',
                phoneNumber: user.phoneNumber || '',
                programme: user.programme || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '', email: '', password: '', role: 'USER',
                department: '', phoneNumber: '', programme: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                await api.put(`/api/auth/users/${editingUser._id}`, formData);
                showNotification('User updated successfully!', 'success');
            } else {
                await api.post('/api/auth/users', formData);
                showNotification('User registered successfully!', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error saving user', 'error');
        }
    };

    const confirmDeleteUser = async () => {
        if (!deleteConfirmUser) return;
        setIsDeletingUser(true);
        try {
            await api.delete(`/api/auth/users/${deleteConfirmUser._id}`);
            showNotification('User deleted successfully!', 'success');
            setDeleteConfirmUser(null);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Deletion failed', 'error');
        } finally {
            setIsDeletingUser(false);
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
        >
            <View style={styles.cardMain}>
                <View style={styles.infoCol}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{item.email}</Text>
                    <Text style={styles.userRole}>Role: {item.role} • Dept: {item.department || 'N/A'}</Text>
                </View>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenModal(item)}>
                        <Edit size={18} color={colors.navy} />
                    </TouchableOpacity>
                    {item.role !== 'SUPER_ADMIN' && (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setDeleteConfirmUser(item)}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Pressable>
    );

    return (
        <Layout
            title={t('user_management')}
            subtitle={t('manage_users_desc')}
            navigation={navigation}
            currentRoute="UsersList"
        >
            <View style={styles.container}>
                {statusBanner && (
                    <View style={styles.alertBanner}>
                        <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.headerBar}>
                    <View style={[styles.searchWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                        <Search size={18} color={isDark ? colors.gold : colors.navy} style={{ marginRight: 8 }} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder={t('search_placeholder')}
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            styles.addBtn,
                            { backgroundColor: colors.navy },
                            pressed && styles.btnPressed
                        ]}
                        onPress={() => handleOpenModal()}
                    >
                        <UserPlus size={18} color="#f59e0b" />
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}

                {/* Modal */}
                {showModal && (
                    <Modal visible animationType="slide" transparent>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}
                        >
                            <View style={[styles.modalContent, cardDynamicStyle, { borderWidth: 1 }]}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingUser ? 'Update Profile' : 'Register Member'}</Text>
                                    <TouchableOpacity onPress={() => setShowModal(false)}>
                                        <X size={22} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]} value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} placeholderTextColor="#94a3b8" />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]} value={formData.email} onChangeText={(t) => setFormData({ ...formData, email: t })} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#94a3b8" />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]} value={formData.department} onChangeText={(t) => setFormData({ ...formData, department: t })} placeholderTextColor="#94a3b8" />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]} secureTextEntry value={formData.password} onChangeText={(t) => setFormData({ ...formData, password: t })} placeholder={editingUser ? "Leave blank to keep current" : ""} placeholderTextColor="#94a3b8" />
                                </ScrollView>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.submitBtn,
                                        { backgroundColor: colors.navy },
                                        pressed && styles.btnPressed
                                    ]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.submitBtnText}>{editingUser ? 'Save Updates' : 'Confirm Registration'}</Text>
                                </Pressable>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                )}

                {/* Custom Delete Confirmation Dialog Modal */}
                {deleteConfirmUser && (
                    <Modal visible animationType="fade" transparent onRequestClose={() => setDeleteConfirmUser(null)}>
                        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(15, 23, 42, 0.65)' }]}>
                            <View style={[styles.confirmDialogCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                                <View style={styles.confirmIconCircle}>
                                    <Trash2 size={28} color="#ef4444" />
                                </View>
                                <Text style={[styles.confirmDialogTitle, { color: colors.textPrimary }]}>
                                    Confirm User Deletion
                                </Text>
                                <Text style={[styles.confirmDialogDesc, { color: colors.textSecondary }]}>
                                    Are you sure you want to delete user{' '}
                                    <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                                        "{deleteConfirmUser.name}" ({deleteConfirmUser.email})
                                    </Text>
                                    ? This user account will be permanently removed.
                                </Text>
                                <View style={styles.confirmDialogActions}>
                                    <TouchableOpacity
                                        style={[styles.confirmCancelBtn, { borderColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc' }]}
                                        onPress={() => setDeleteConfirmUser(null)}
                                        disabled={isDeletingUser}
                                    >
                                        <Text style={[styles.confirmCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.confirmDeleteBtn,
                                            pressed && { opacity: 0.8 },
                                            isDeletingUser && { opacity: 0.6 }
                                        ]}
                                        onPress={confirmDeleteUser}
                                        disabled={isDeletingUser}
                                    >
                                        {isDeletingUser ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.confirmDeleteBtnText}>Delete User</Text>
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
    headerBar: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#0f172a',
        borderWidth: 0,
    },
    addBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#1e3a8a',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
        elevation: 2,
    },
    btnPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.95 }],
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
    },
    cardPressed: {
        borderColor: '#1e3a8a',
        transform: [{ scale: 0.985 }],
    },
    cardMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoCol: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    userEmail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    userRole: {
        fontSize: 12,
        color: '#d97706',
        fontWeight: '700',
        marginTop: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        padding: 8,
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
        maxWidth: 580,
        alignSelf: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        elevation: 8,
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
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
        marginTop: 10,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        color: '#0f172a',
        backgroundColor: '#f8fafc',
    },
    submitBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    submitBtnText: {
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

export default UsersList;
