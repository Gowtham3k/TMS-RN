import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, ScrollView, Alert, ActivityIndicator, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, ChevronLeft, CheckCircle2 } from 'lucide-react-native';

const MasterData = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [allData, setAllData] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', shortName: '', description: '', type: '', parentId: '', departmentId: '' });
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [statusBanner, setStatusBanner] = useState(null);
    const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => {
            setStatusBanner(null);
        }, 4000);
    };

    const sections = [
        { id: 'DEPARTMENT', title: t('departments'), color: '#1e3a8a', desc: 'Departments' },
        { id: 'PROGRAMME', title: t('programmes'), color: '#d97706', desc: 'Degrees & Programmes' },
        { id: 'BLOCK', title: t('blocks'), color: '#1e40af', desc: 'Blocks & Buildings' },
        { id: 'ROOM', title: t('rooms'), color: '#15803d', desc: 'Rooms & Labs' },
        { id: 'ROLE', title: t('roles'), color: '#f59e0b', desc: 'User Roles' },
        { id: 'CATEGORY', title: t('categories'), color: '#0284c7', desc: 'Complaint Categories' },
        { id: 'PRIORITY', title: t('priorities'), color: '#dc2626', desc: 'Priority Levels' }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/master-data');
            setAllData(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const departments = allData.filter(item => item.type === 'DEPARTMENT');
    const blocks = allData.filter(item => item.type === 'BLOCK');

    const getCount = (type) => allData.filter(item => item.type === type.toUpperCase()).length;

    const handleOpenModal = (type, item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                shortName: item.shortName || '',
                description: item.description || '',
                type: item.type,
                parentId: item.parentId?._id || item.parentId || '',
                departmentId: item.departmentId?._id || item.departmentId || ''
            });
        } else {
            setEditingItem(null);
            const defaultParent = (selectedDeptFilter !== 'ALL' && (type === 'PROGRAMME' || type === 'BLOCK')) ? selectedDeptFilter : '';
            const defaultDept = (selectedDeptFilter !== 'ALL' && type === 'ROOM') ? selectedDeptFilter : '';
            setFormData({
                name: '',
                shortName: '',
                description: '',
                type: type,
                parentId: defaultParent,
                departmentId: defaultDept
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        if (formData.type === 'PROGRAMME' && !formData.parentId) {
            Alert.alert('Required', 'Please select a parent Department for this Programme.');
            return;
        }

        if (formData.type === 'BLOCK' && !formData.parentId) {
            Alert.alert('Required', 'Please select a parent Department for this Block.');
            return;
        }

        if (formData.type === 'ROOM' && !formData.parentId) {
            Alert.alert('Required', 'Please select a parent Block for this Room.');
            return;
        }

        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.parentId) delete dataToSubmit.parentId;
            if (!dataToSubmit.departmentId) delete dataToSubmit.departmentId;

            if (editingItem) {
                await api.put(`/api/master-data/${editingItem._id}`, dataToSubmit);
                showNotification('Updated successfully!', 'success');
            } else {
                await api.post('/api/master-data', dataToSubmit);
                showNotification('Created successfully!', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || 'Operation failed');
        }
    };

    const handleDelete = (item) => {
        setDeleteConfirmItem(item);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmItem) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/master-data/${deleteConfirmItem._id}`);
            showNotification(`"${deleteConfirmItem.name}" deleted successfully!`, 'success');
            setDeleteConfirmItem(null);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Deletion failed', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter items based on activeSection and optional selectedDeptFilter
    const filteredItems = allData.filter(item => {
        if (item.type !== activeSection) return false;
        if (selectedDeptFilter === 'ALL') return true;

        if (activeSection === 'PROGRAMME' || activeSection === 'BLOCK') {
            const pId = item.parentId?._id || item.parentId;
            return String(pId) === String(selectedDeptFilter);
        }

        if (activeSection === 'ROOM') {
            const dId = item.departmentId?._id || item.departmentId;
            const blockDeptId = item.parentId?.departmentId?._id || item.parentId?.departmentId || item.parentId?.parentId?._id || item.parentId?.parentId;
            return String(dId) === String(selectedDeptFilter) || String(blockDeptId) === String(selectedDeptFilter);
        }

        return true;
    });

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    // Blocks available in Room modal (filtered by selected dept if set)
    const blocksForRoomModal = formData.departmentId
        ? blocks.filter(b => (String(b.parentId?._id || b.parentId) === String(formData.departmentId)))
        : blocks;

    return (
        <Layout
            title={activeSection ? sections.find(s => s.id === activeSection)?.title : t('master_data')}
            subtitle={t('master_data_subtitle')}
            navigation={navigation}
            currentRoute="MasterData"
        >
            <View style={styles.container}>
                {statusBanner && (
                    <View style={[styles.alertBanner, statusBanner.type === 'error' ? styles.alertError : styles.alertSuccess]}>
                        <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}
                {activeSection ? (
                    <View style={styles.sectionDetail}>
                        <View style={styles.topRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => { setActiveSection(null); setSelectedDeptFilter('ALL'); }}>
                                <ChevronLeft size={20} color={colors.navy} />
                                <Text style={[styles.backText, { color: colors.navy }]}>Back</Text>
                            </TouchableOpacity>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.addBtn,
                                    pressed && styles.btnPressed
                                ]}
                                onPress={() => handleOpenModal(activeSection)}
                            >
                                <Plus size={18} color="#ffffff" />
                                <Text style={styles.addBtnText}>{t('add_new')}</Text>
                            </Pressable>
                        </View>

                        {/* Department Filter Pills for Hierarchical Sections */}
                        {(activeSection === 'PROGRAMME' || activeSection === 'BLOCK' || activeSection === 'ROOM') && departments.length > 0 && (
                            <View style={styles.filterBar}>
                                <Text style={[styles.filterBarLabel, { color: colors.textSecondary }]}>Filter by Department:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                                    <TouchableOpacity
                                        style={[
                                            styles.deptPill,
                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                            selectedDeptFilter === 'ALL' && { backgroundColor: colors.navy, borderColor: colors.navy }
                                        ]}
                                        onPress={() => setSelectedDeptFilter('ALL')}
                                    >
                                        <Text style={[styles.deptPillText, { color: colors.textSecondary }, selectedDeptFilter === 'ALL' && styles.deptPillTextActive]}>
                                            All ({allData.filter(i => i.type === activeSection).length})
                                        </Text>
                                    </TouchableOpacity>
                                    {departments.map(d => {
                                        const count = allData.filter(i => {
                                            if (i.type !== activeSection) return false;
                                            if (activeSection === 'ROOM') {
                                                const dId = i.departmentId?._id || i.departmentId;
                                                const bDeptId = i.parentId?.departmentId?._id || i.parentId?.departmentId || i.parentId?.parentId?._id || i.parentId?.parentId;
                                                return String(dId) === String(d._id) || String(bDeptId) === String(d._id);
                                            }
                                            const pId = i.parentId?._id || i.parentId;
                                            return String(pId) === String(d._id);
                                        }).length;
                                        return (
                                            <TouchableOpacity
                                                key={d._id}
                                                style={[
                                                    styles.deptPill,
                                                    { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                    selectedDeptFilter === d._id && { backgroundColor: colors.navy, borderColor: colors.navy }
                                                ]}
                                                onPress={() => setSelectedDeptFilter(d._id)}
                                            >
                                                <Text style={[styles.deptPillText, { color: colors.textSecondary }, selectedDeptFilter === d._id && styles.deptPillTextActive]}>
                                                    {d.shortName || d.name} ({count})
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {loading ? (
                            <ActivityIndicator style={{ padding: 40 }} color={colors.navy} />
                        ) : (
                            <FlatList
                                data={filteredItems}
                                keyExtractor={item => item._id}
                                renderItem={({ item }) => (
                                    <View style={[styles.itemCard, cardDynamicStyle]}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                                                {item.shortName ? (
                                                    <View style={styles.codeBadge}>
                                                        <Text style={styles.codeBadgeText}>{item.shortName}</Text>
                                                    </View>
                                                ) : null}
                                            </View>

                                            {/* Hierarchical Badges */}
                                            {activeSection === 'PROGRAMME' && (
                                                <View style={styles.metaRow}>
                                                    <View style={[styles.metaBadge, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fffbeb' }]}>
                                                        <Text style={[styles.metaBadgeText, { color: '#d97706' }]}>
                                                            🏢 Dept: {item.parentId?.name || item.parentId?.shortName || 'Unassigned'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {activeSection === 'BLOCK' && (
                                                <View style={styles.metaRow}>
                                                    <View style={[styles.metaBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                                                        <Text style={[styles.metaBadgeText, { color: isDark ? '#60a5fa' : '#1e3a8a' }]}>
                                                            🏢 Dept: {item.parentId?.name || item.parentId?.shortName || 'General'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {activeSection === 'ROOM' && (
                                                <View style={[styles.metaRow, { gap: 6 }]}>
                                                    <View style={[styles.metaBadge, { backgroundColor: isDark ? 'rgba(21, 128, 61, 0.2)' : '#f0fdf4' }]}>
                                                        <Text style={[styles.metaBadgeText, { color: '#15803d' }]}>
                                                            🏛️ Block: {item.parentId?.name || '-'}
                                                        </Text>
                                                    </View>
                                                    {(item.departmentId?.name || item.parentId?.parentId?.name) ? (
                                                        <View style={[styles.metaBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                                                            <Text style={[styles.metaBadgeText, { color: isDark ? '#60a5fa' : '#1e3a8a' }]}>
                                                                🏢 Dept: {item.departmentId?.shortName || item.departmentId?.name || item.parentId?.parentId?.shortName || item.parentId?.parentId?.name}
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.iconRow}>
                                            <TouchableOpacity onPress={() => handleOpenModal(activeSection, item)}>
                                                <Edit size={18} color={colors.navy} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleDelete(item)}
                                                style={{ marginLeft: 8, padding: 6 }}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Trash2 size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View style={{ padding: 30, alignItems: 'center' }}>
                                        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No records found in this selection.</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.grid}>
                        {sections.map(s => (
                            <Pressable
                                key={s.id}
                                style={({ pressed }) => [
                                    styles.secCard,
                                    cardDynamicStyle,
                                    { borderLeftColor: s.color },
                                    pressed && styles.cardPressed
                                ]}
                                onPress={() => { setActiveSection(s.id); setSelectedDeptFilter('ALL'); }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.secTitle, { color: colors.textPrimary }]}>{s.title}</Text>
                                    <Text style={styles.secSub}>{getCount(s.id)} {t('records')} • {s.desc}</Text>
                                </View>
                                <TouchableOpacity style={[styles.plusCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]} onPress={() => handleOpenModal(s.id)}>
                                    <Plus size={18} color={isDark ? colors.gold : s.color} />
                                </TouchableOpacity>
                            </Pressable>
                        ))}
                    </ScrollView>
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
                                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingItem ? t('edit_item') : t('add_item')}</Text>
                                    <TouchableOpacity onPress={() => setShowModal(false)}>
                                        <X size={22} color={colors.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('field_name')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                        value={formData.name}
                                        onChangeText={(t) => setFormData({ ...formData, name: t })}
                                        placeholder={formData.type === 'PROGRAMME' ? 'e.g. BCA, MCA, BSc CS' : formData.type === 'BLOCK' ? 'e.g. Block-A, O-Block' : formData.type === 'ROOM' ? 'e.g. 101, Lab-3' : 'Name'}
                                        placeholderTextColor="#94a3b8"
                                    />

                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('field_short_name')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                                        value={formData.shortName}
                                        onChangeText={(t) => setFormData({ ...formData, shortName: t })}
                                        placeholder="Short code / Abbreviation (e.g. MCA)"
                                        placeholderTextColor="#94a3b8"
                                    />

                                    {/* Department selection for PROGRAMME & BLOCK */}
                                    {(formData.type === 'PROGRAMME' || formData.type === 'BLOCK') && (
                                        <View style={{ marginTop: 12 }}>
                                            <Text style={[styles.label, { color: colors.textSecondary }]}>Linked Department *</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                                                {departments.map(d => (
                                                    <TouchableOpacity
                                                        key={d._id}
                                                        style={[
                                                            styles.selectChip,
                                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                            formData.parentId === d._id && { backgroundColor: '#d97706', borderColor: '#d97706' }
                                                        ]}
                                                        onPress={() => setFormData({ ...formData, parentId: d._id })}
                                                    >
                                                        <Text style={[styles.selectChipText, { color: colors.textSecondary }, formData.parentId === d._id && styles.selectChipTextActive]}>
                                                            {d.name} {d.shortName ? `(${d.shortName})` : ''}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* Hierarchical selection for ROOM (Dept -> Block) */}
                                    {formData.type === 'ROOM' && (
                                        <View style={{ marginTop: 12 }}>
                                            <Text style={[styles.label, { color: colors.textSecondary }]}>1. Department (Optional Filter)</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                                                {departments.map(d => (
                                                    <TouchableOpacity
                                                        key={d._id}
                                                        style={[
                                                            styles.selectChip,
                                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                            formData.departmentId === d._id && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }
                                                        ]}
                                                        onPress={() => setFormData({ ...formData, departmentId: d._id })}
                                                    >
                                                        <Text style={[styles.selectChipText, { color: colors.textSecondary }, formData.departmentId === d._id && styles.selectChipTextActive]}>
                                                            {d.name} {d.shortName ? `(${d.shortName})` : ''}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>

                                            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 10 }]}>2. Select Block *</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                                                {blocksForRoomModal.map(b => (
                                                    <TouchableOpacity
                                                        key={b._id}
                                                        style={[
                                                            styles.selectChip,
                                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                            formData.parentId === b._id && { backgroundColor: '#15803d', borderColor: '#15803d' }
                                                        ]}
                                                        onPress={() => {
                                                            const parentDeptId = b.parentId?._id || b.parentId;
                                                            setFormData({
                                                                ...formData,
                                                                parentId: b._id,
                                                                departmentId: parentDeptId || formData.departmentId
                                                            });
                                                        }}
                                                    >
                                                        <Text style={[styles.selectChipText, { color: colors.textSecondary }, formData.parentId === b._id && styles.selectChipTextActive]}>
                                                            Block {b.name} {b.parentId?.name ? `(${b.parentId.name})` : ''}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </ScrollView>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.submitBtn,
                                        pressed && styles.btnPressed
                                    ]}
                                    onPress={handleSubmit}
                                >
                                    <Text style={styles.submitBtnText}>{editingItem ? t('save_updates') : t('confirm_registration')}</Text>
                                </Pressable>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirmItem && (
                    <Modal visible animationType="fade" transparent onRequestClose={() => setDeleteConfirmItem(null)}>
                        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
                            <View style={[styles.deleteModalCard, cardDynamicStyle, { borderWidth: 1 }]}>
                                <View style={styles.deleteIconCircle}>
                                    <Trash2 size={28} color="#ef4444" />
                                </View>
                                <Text style={[styles.deleteModalTitle, { color: colors.textPrimary }]}>
                                    Confirm Deletion
                                </Text>
                                <Text style={[styles.deleteModalDesc, { color: colors.textSecondary }]}>
                                    Are you sure you want to permanently delete{' '}
                                    <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>
                                        "{deleteConfirmItem.name}"
                                    </Text>
                                    ? This record will be removed from the system.
                                </Text>
                                <View style={styles.deleteModalActions}>
                                    <TouchableOpacity
                                        style={[styles.deleteCancelBtn, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder }]}
                                        onPress={() => setDeleteConfirmItem(null)}
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
                                        onPress={confirmDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.deleteConfirmBtnText}>Delete Record</Text>
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
    grid: {
        gap: 12,
    },
    secCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 6,
        flexDirection: 'row',
        alignItems: 'center',
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
    secTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    secSub: {
        fontSize: 12,
        color: '#d97706',
        marginTop: 2,
        fontWeight: '600',
    },
    plusCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionDetail: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginLeft: 4,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    addBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    btnPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    itemCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    itemSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    iconRow: {
        flexDirection: 'row',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
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
        marginBottom: 6,
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
        marginTop: 20,
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    alertSuccess: {
        backgroundColor: '#10b981',
    },
    alertError: {
        backgroundColor: '#ef4444',
    },
    alertBannerText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    filterBar: {
        marginBottom: 12,
    },
    filterBarLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    deptPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    deptPillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deptPillTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    codeBadge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    codeBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
    },
    metaBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    metaBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    selectChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginRight: 8,
    },
    selectChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    selectChipTextActive: {
        color: '#ffffff',
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

export default MasterData;
