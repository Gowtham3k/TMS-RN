import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import storage from '../utils/storage';
import { CheckCircle2, X } from 'lucide-react-native';

const RaiseComplaint = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const userStr = storage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        location: '',
        department: '',
        programme: '',
        block: '',
        roomNo: '',
        priority: 'Medium',
        date: new Date().toISOString().split('T')[0]
    });

    const [allMasterData, setAllMasterData] = useState({
        departments: [],
        programmes: [],
        categories: [],
        blocks: [],
        rooms: []
    });

    const [selectedDeptId, setSelectedDeptId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [ticketsCount, setTicketsCount] = useState(1);
    const [focusedInput, setFocusedInput] = useState(null);
    const [statusBanner, setStatusBanner] = useState(null);

    const showNotification = (msg, type = 'success') => {
        setStatusBanner({ text: msg, type });
        setTimeout(() => setStatusBanner(null), 4000);
    };

    // Helper to resolve user department
    const resolveUserDept = (depts, currentUser) => {
        if (!currentUser || depts.length === 0) return depts[0] || null;
        const uDept = (currentUser.department || '').trim().toLowerCase();
        const uProg = (currentUser.programme || '').trim().toLowerCase();
        const uEmail = (currentUser.email || '').trim().toLowerCase();

        // 1. Direct match by _id or name or shortName
        let found = depts.find(d =>
            String(d._id) === String(currentUser.department) ||
            d.name.toLowerCase() === uDept ||
            (d.shortName && d.shortName.toLowerCase() === uDept)
        );
        if (found) return found;

        // 2. School of Computer Studies / MCA / BCA check
        if (
            uDept.includes('computer') ||
            uDept.includes('mca') ||
            uDept.includes('scs') ||
            uDept.includes('ca') ||
            uProg.includes('computer') ||
            uProg.includes('mca') ||
            uProg.includes('bca') ||
            uEmail.includes('mca')
        ) {
            found = depts.find(d =>
                d.name.toLowerCase().includes('computer studies') ||
                d.shortName?.toLowerCase() === 'scs' ||
                d.name.toLowerCase().includes('computer')
            );
            if (found) return found;
        }

        // 3. School of Business Studies / Management / MBA / BBA check
        if (
            uDept.includes('business') ||
            uDept.includes('buisness') ||
            uDept.includes('management') ||
            uDept.includes('sbs') ||
            uDept.includes('mba') ||
            uProg.includes('mba') ||
            uProg.includes('bba') ||
            uProg.includes('business')
        ) {
            found = depts.find(d =>
                d.name.toLowerCase().includes('business') ||
                d.shortName?.toLowerCase() === 'sbs'
            );
            if (found) return found;
        }

        // 4. School of Information Technology / IT / SIT check
        if (
            uDept.includes('information') ||
            uDept.includes('it') ||
            uDept.includes('sit') ||
            uProg.includes('information') ||
            uProg.includes('it')
        ) {
            found = depts.find(d =>
                d.name.toLowerCase().includes('information technology') ||
                d.shortName?.toLowerCase() === 'sit'
            );
            if (found) return found;
        }

        // 5. General substring match
        if (uDept) {
            found = depts.find(d => d.name.toLowerCase().includes(uDept) || uDept.includes(d.name.toLowerCase()));
            if (found) return found;
        }

        return depts[0] || null;
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await api.get('/api/master-data');
                const data = res.data || [];

                const depts = data.filter(i => String(i.type).toUpperCase() === 'DEPARTMENT');
                const progs = data.filter(i => String(i.type).toUpperCase() === 'PROGRAMME');
                const blocks = data.filter(i => String(i.type).toUpperCase() === 'BLOCK');
                const rooms = data.filter(i => String(i.type).toUpperCase() === 'ROOM');
                const cats = data.filter(i => String(i.type).toUpperCase() === 'CATEGORY');

                setAllMasterData({
                    departments: depts,
                    programmes: progs,
                    blocks: blocks,
                    rooms: rooms,
                    categories: cats
                });

                const matched = resolveUserDept(depts, user);
                const activeDept = matched || depts[0];
                if (activeDept) {
                    setSelectedDeptId(activeDept._id);
                }

                api.get('/api/complaints/stats').then(sRes => setTicketsCount((sRes.data?.total || 0) + 1)).catch(() => { });

                // Set initial default form data
                const defaultCat = cats.length > 0 ? cats[0].name : 'Hardware';
                const defaultDeptName = activeDept ? activeDept.name : (user.department || '');
                const defaultProgName = user.programme || '';

                // Find initial blocks and rooms for activeDept
                const initialBlocks = activeDept ? blocks.filter(b => (String(b.parentId?._id || b.parentId) === String(activeDept._id) || b.parentId?.name === activeDept.name)) : [];
                const defaultBlockName = initialBlocks.length > 0 ? initialBlocks[0].name : '';

                setFormData(prev => ({
                    ...prev,
                    type: prev.type || defaultCat,
                    department: defaultDeptName,
                    programme: defaultProgName,
                    block: prev.block || defaultBlockName,
                    location: prev.location || defaultBlockName
                }));
            } catch (err) {
                console.error('Error loading master data:', err);
            }
        };
        fetchMasterData();
    }, []);

    // Active department object
    const activeDept = allMasterData.departments.find(d => d._id === selectedDeptId) || resolveUserDept(allMasterData.departments, user);

    // Filtered departments: regular user ONLY sees their department; Admin sees all
    const displayedDepts = isAdmin
        ? allMasterData.departments
        : (activeDept ? [activeDept] : allMasterData.departments);

    // Filtered Programmes for active department
    const availableProgs = activeDept
        ? allMasterData.programmes.filter(p =>
            String(p.parentId?._id || p.parentId) === String(activeDept._id) ||
            (p.parentId?.name && p.parentId.name.toLowerCase() === activeDept.name.toLowerCase())
        )
        : allMasterData.programmes;

    // Filtered Blocks for active department
    const availableBlocks = activeDept
        ? allMasterData.blocks.filter(b =>
            String(b.parentId?._id || b.parentId) === String(activeDept._id) ||
            (b.parentId?.name && b.parentId.name.toLowerCase() === activeDept.name.toLowerCase())
        )
        : allMasterData.blocks;

    const deptBlockIds = availableBlocks.map(b => String(b._id));

    // All rooms belonging to active department (either directly or via block)
    const availableRoomsForDept = activeDept
        ? allMasterData.rooms.filter(r =>
            String(r.departmentId?._id || r.departmentId) === String(activeDept._id) ||
            deptBlockIds.includes(String(r.parentId?._id || r.parentId))
        )
        : allMasterData.rooms;

    // When a block is selected, filter rooms to that block; otherwise show all dept rooms
    const selectedBlockObj = availableBlocks.find(b => b.name === formData.block);
    const availableRooms = selectedBlockObj
        ? availableRoomsForDept.filter(r =>
            String(r.parentId?._id || r.parentId) === String(selectedBlockObj._id) ||
            r.parentId?.name === formData.block
        )
        : availableRoomsForDept;

    const handleSelectDept = (dept) => {
        setSelectedDeptId(dept._id);
        const newBlocks = allMasterData.blocks.filter(b => b.parentId?._id === dept._id || b.parentId === dept._id);
        const defaultBlk = newBlocks.length > 0 ? newBlocks[0].name : '';
        setFormData(prev => ({
            ...prev,
            department: dept.name,
            programme: '',
            block: defaultBlk,
            location: defaultBlk,
            roomNo: ''
        }));
    };

    const handleSelectBlock = (blk) => {
        setFormData(prev => ({
            ...prev,
            block: blk.name,
            location: blk.name,
            roomNo: ''
        }));
    };

    const handleSelectRoom = (room) => {
        const roomBlockName = room.parentId?.name || '';
        setFormData(prev => ({
            ...prev,
            roomNo: room.name,
            block: prev.block || roomBlockName,
            location: prev.location || roomBlockName || prev.block
        }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.description) {
            Alert.alert('Error', 'Please enter a title and description');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                type: formData.type || 'General',
                priority: formData.priority || 'Medium',
                location: formData.location || formData.block || 'Main Campus',
                department: formData.department || activeDept?.name || user.department || 'General',
                roomNo: formData.roomNo || 'N/A'
            };
            await api.post('/api/complaints', payload);
            showNotification('Ticket created successfully!', 'success');
            setTimeout(() => {
                if (navigation) navigation.navigate('Dashboard');
            }, 1000);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.msg || err.response?.data || 'Error raising ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const cardDynamicStyle = {
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
    };

    const inputDynamicStyle = (isFocused) => ({
        backgroundColor: colors.inputBg,
        borderColor: isFocused ? colors.navy : colors.inputBorder,
        color: colors.textPrimary,
    });

    return (
        <Layout
            title={t('raise_new_title')}
            subtitle={t('raise_new_desc')}
            navigation={navigation}
            currentRoute="RaiseComplaint"
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {statusBanner && (
                    <View style={styles.alertBanner}>
                        <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.alertBannerText}>{statusBanner.text}</Text>
                        <TouchableOpacity onPress={() => setStatusBanner(null)} style={{ marginLeft: 'auto', padding: 2 }}>
                            <X size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={[styles.card, cardDynamicStyle]}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('raise_new_title')}</Text>
                        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fff7ed', borderColor: '#fde68a' }]}>
                            <Text style={styles.badgeText}>#CMP-{(2500 + ticketsCount)}</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('subject_title')}</Text>
                        <TextInput
                            style={[styles.input, inputDynamicStyle(focusedInput === 'title')]}
                            placeholder={t('subject_placeholder')}
                            placeholderTextColor="#94a3b8"
                            value={formData.title}
                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                            onFocus={() => setFocusedInput('title')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('description')}</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, inputDynamicStyle(focusedInput === 'desc')]}
                            placeholder={t('desc_placeholder')}
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={5}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            onFocus={() => setFocusedInput('desc')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>

                    {/* Priority selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('priority')}</Text>
                        <View style={styles.priorityRow}>
                            {['Low', 'Medium', 'High', 'Emergency'].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[
                                        styles.priorityBtn,
                                        { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                                        formData.priority === p && { backgroundColor: colors.navy, borderColor: colors.navy }
                                    ]}
                                    onPress={() => setFormData({ ...formData, priority: p })}
                                >
                                    <Text style={[
                                        styles.priorityBtnText,
                                        { color: colors.textSecondary },
                                        formData.priority === p && styles.priorityBtnTextActive
                                    ]}>{p}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Category selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('complaint_type')}</Text>
                        {allMasterData.categories.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {allMasterData.categories.map(c => (
                                    <TouchableOpacity
                                        key={c._id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                            formData.type === c.name && { backgroundColor: '#d97706', borderColor: '#d97706' }
                                        ]}
                                        onPress={() => setFormData({ ...formData, type: c.name })}
                                    >
                                        <Text style={[styles.chipText, { color: colors.textSecondary }, formData.type === c.name && styles.chipTextActive]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TextInput
                            style={[styles.input, inputDynamicStyle(focusedInput === 'type')]}
                            placeholder="e.g. Hardware, Network, Electrical"
                            placeholderTextColor="#94a3b8"
                            value={formData.type}
                            onChangeText={(text) => setFormData({ ...formData, type: text })}
                            onFocus={() => setFocusedInput('type')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>

                    {/* Department selection (Filtered for User / MCA) */}
                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('department')}</Text>
                            {!isAdmin && activeDept && (
                                <Text style={{ fontSize: 11, color: '#10b981', fontWeight: 'bold' }}>✓ Verified Dept</Text>
                            )}
                        </View>
                        {displayedDepts.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {displayedDepts.map(d => {
                                    const isSelected = selectedDeptId === d._id || formData.department === d.name;
                                    return (
                                        <TouchableOpacity
                                            key={d._id}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                                isSelected && { backgroundColor: '#d97706', borderColor: '#d97706' }
                                            ]}
                                            onPress={() => handleSelectDept(d)}
                                        >
                                            <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && styles.chipTextActive]}>
                                                {d.name} {d.shortName ? `(${d.shortName})` : ''}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                        <TextInput
                            style={[styles.input, inputDynamicStyle(focusedInput === 'dept')]}
                            placeholder="e.g. MCA, Computer Applications"
                            placeholderTextColor="#94a3b8"
                            value={formData.department}
                            onChangeText={(text) => setFormData({ ...formData, department: text })}
                            onFocus={() => setFocusedInput('dept')}
                            onBlur={() => setFocusedInput(null)}
                            editable={isAdmin}
                        />
                    </View>

                    {/* Academic Programme / Course (Filtered for Department) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Programme / Course</Text>
                        {availableProgs.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {availableProgs.map(p => (
                                    <TouchableOpacity
                                        key={p._id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                            formData.programme === p.name && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }
                                        ]}
                                        onPress={() => setFormData({ ...formData, programme: p.name })}
                                    >
                                        <Text style={[styles.chipText, { color: colors.textSecondary }, formData.programme === p.name && styles.chipTextActive]}>
                                            {p.name} {p.shortName ? `(${p.shortName})` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TextInput
                            style={[styles.input, inputDynamicStyle(focusedInput === 'prog')]}
                            placeholder="e.g. MCA, BCA, BSc Computer Science"
                            placeholderTextColor="#94a3b8"
                            value={formData.programme}
                            onChangeText={(text) => setFormData({ ...formData, programme: text })}
                            onFocus={() => setFocusedInput('prog')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>

                    {/* Block and Room No (Filtered for Department & Block) */}
                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('location_block')} & {t('room_no')}</Text>
                            {activeDept && (
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                    {activeDept.shortName || activeDept.name} Facilities
                                </Text>
                            )}
                        </View>

                        {/* Block Chips */}
                        {availableBlocks.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                                {availableBlocks.map(b => (
                                    <TouchableOpacity
                                        key={b._id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                            formData.block === b.name && { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' }
                                        ]}
                                        onPress={() => handleSelectBlock(b)}
                                    >
                                        <Text style={[styles.chipText, { color: colors.textSecondary }, formData.block === b.name && styles.chipTextActive]}>
                                            {b.name.toLowerCase().startsWith('block') ? b.name : `Block ${b.name}`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Room Chips (Dynamically filtered by selected block) */}
                        {availableRooms.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {availableRooms.map(r => (
                                    <TouchableOpacity
                                        key={r._id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder },
                                            formData.roomNo === r.name && { backgroundColor: '#15803d', borderColor: '#15803d' }
                                        ]}
                                        onPress={() => handleSelectRoom(r)}
                                    >
                                        <Text style={[styles.chipText, { color: colors.textSecondary }, formData.roomNo === r.name && styles.chipTextActive]}>
                                            {r.name.toLowerCase().startsWith('room') || r.name.toLowerCase().startsWith('lab') || r.name.toLowerCase().startsWith('seminar') ? r.name : `Room ${r.name}`} {r.parentId?.name ? `(${r.parentId.name})` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }, inputDynamicStyle(focusedInput === 'block')]}
                                placeholder="Block (e.g. Block-A)"
                                placeholderTextColor="#94a3b8"
                                value={formData.block || formData.location}
                                onChangeText={(text) => setFormData({ ...formData, block: text, location: text })}
                                onFocus={() => setFocusedInput('block')}
                                onBlur={() => setFocusedInput(null)}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }, inputDynamicStyle(focusedInput === 'room')]}
                                placeholder="Room (e.g. 104)"
                                placeholderTextColor="#94a3b8"
                                value={formData.roomNo}
                                onChangeText={(text) => setFormData({ ...formData, roomNo: text })}
                                onFocus={() => setFocusedInput('room')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.submitBtn,
                            pressed && styles.submitBtnPressed
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.submitBtnText}>{t('submit_request')}</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    badge: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    badgeText: {
        color: '#d97706',
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
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
    textArea: {
        height: 120,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    priorityRow: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    priorityBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    priorityBtnTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    chipText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    submitBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
        elevation: 3,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    submitBtnPressed: {
        backgroundColor: '#1e40af',
        transform: [{ scale: 0.985 }],
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
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
    }
});

export default RaiseComplaint;
