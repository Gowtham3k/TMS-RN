import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable, ImageBackground, Animated, Platform, KeyboardAvoidingView, Keyboard } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import { Mail, Lock, Eye, EyeOff, Info, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react-native';
import storage from '../utils/storage';

const Login = ({ navigation }) => {
    const { t } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [keyboardSpace, setKeyboardSpace] = useState(0);

    const scrollViewRef = useRef(null);

    // Keyboard listener for dynamic scroll padding
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, (e) => {
            const h = e.endCoordinates ? e.endCoordinates.height : 280;
            setKeyboardSpace(h);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardSpace(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const scrollToField = (yOffset) => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        }, 120);
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
        }, 320);
    };

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: false,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 700,
                useNativeDriver: false,
            }),
        ]).start();

        const checkMaintenance = async () => {
            try {
                const res = await api.get('/api/settings');
                if (res.data.isSystemUnderMaintenance === true) {
                    setMaintenanceMode(true);
                }
            } catch (err) {
                // Ignore
            }
        };
        checkMaintenance();
    }, []);

    const handleSubmit = async () => {
        setEmailError('');
        setPasswordError('');

        let hasError = false;
        if (!email.trim()) {
            setEmailError('Please enter email address / மின்னஞ்சலை உள்ளிடவும்');
            hasError = true;
        }
        if (!password) {
            setPasswordError('Please enter password / கடவுச்சொல்லை உள்ளிடவும்');
            hasError = true;
        }
        if (hasError) return;

        setLoading(true);
        try {
            const cleanEmail = email.trim();
            const res = await api.post('/api/auth/login', { email: cleanEmail, password });
            storage.setItem('token', res.data.token);
            storage.setItem('user', JSON.stringify(res.data.user));
            if (navigation) navigation.navigate('Home');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errorType === 'WRONG_PASSWORD') {
                setPasswordError('Wrong password / தவறான கடவுச்சொல் (Use: Admin@123, Staff@123, or User@1234)');
            } else if (data?.errorType === 'EMAIL_NOT_FOUND') {
                setEmailError(data.msg || 'User not found / பயனர் கணக்கு இல்லை');
            } else if (!err.response) {
                setPasswordError(`Cannot connect to server (${api.defaults.baseURL}). Please verify backend is running on your network.`);
            } else {
                setPasswordError(data?.msg || t('login_failed') || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

    return (
        <ImageBackground
            source={require('../assets/bg_pattern.png')}
            style={styles.bgImage}
            imageStyle={styles.bgImageStyle}
            resizeMode="cover"
        >
            <KeyboardWrapper
                style={{ flex: 1 }}
                {...(Platform.OS === 'ios' ? { behavior: 'padding' } : {})}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[
                        styles.container,
                        {
                            paddingBottom: keyboardSpace > 0 
                                ? (Platform.OS === 'android' ? keyboardSpace + 120 : 120) 
                                : 80
                        }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={false}
                    overScrollMode="always"
                    bounces={true}
                >
                    <Animated.View style={[
                        styles.animatedWrapper,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}>
                        <View style={styles.headerArea}>
                            <View style={styles.logoBadge}>
                                <ShieldCheck size={28} color="#f59e0b" style={{ marginRight: 8 }} />
                                <Text style={styles.logoText}>TMS</Text>
                            </View>
                            <Text style={styles.title}>{t('system_title')}</Text>
                            <Text style={styles.subtitle}>{t('system_subtitle')}</Text>
                        </View>
                    </Animated.View>

                    <View collapsable={false} style={styles.card}>
                        {maintenanceMode && (
                            <View style={styles.maintenanceBanner}>
                                <Info size={18} color="#ef4444" />
                                <Text style={styles.maintenanceText}>{t('maintenance_active_msg')}</Text>
                            </View>
                        )}

                        <View style={styles.cardTitleRow}>
                            <Text style={styles.loginTitle}>{t('login_title')}</Text>
                            <View style={styles.goldPill}>
                                <Sparkles size={12} color="#d97706" />
                                <Text style={styles.goldPillText}>Executive</Text>
                            </View>
                        </View>

                        {/* Quick Demo Role Selector */}
                        <View style={styles.roleChipsContainer}>
                            <Text style={styles.roleSelectLabel}>Quick Select Role (Auto-fills credentials):</Text>
                            <View style={styles.roleChipsRow}>
                                <TouchableOpacity
                                    style={[styles.roleChip, email === 'admin@tms.com' && styles.roleChipActive]}
                                    onPress={() => { setEmail('admin@tms.com'); setPassword('Admin@123'); setEmailError(''); setPasswordError(''); }}
                                >
                                    <Text style={[styles.roleChipText, email === 'admin@tms.com' && styles.roleChipTextActive]}>👑 Admin</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleChip, (email === 'staff@tms.com' || email === 'guru@gmail.com') && styles.roleChipActive]}
                                    onPress={() => { setEmail('staff@tms.com'); setPassword('Staff@123'); setEmailError(''); setPasswordError(''); }}
                                >
                                    <Text style={[styles.roleChipText, (email === 'staff@tms.com' || email === 'guru@gmail.com') && styles.roleChipTextActive]}>🔧 Staff</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleChip, (email === 'user@tms.com' || email === 'siddu@gmail.com') && styles.roleChipActive]}
                                    onPress={() => { setEmail('user@tms.com'); setPassword('User@1234'); setEmailError(''); setPasswordError(''); }}
                                >
                                    <Text style={[styles.roleChipText, (email === 'user@tms.com' || email === 'siddu@gmail.com') && styles.roleChipTextActive]}>👤 User</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Email Input */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('email_lbl')}</Text>
                            <View collapsable={false} style={[
                                styles.inputWrapper,
                                emailError ? styles.inputWrapperError : null
                            ]}>
                                <Mail size={18} color={emailError ? '#ef4444' : '#1e3a8a'} style={styles.inputIcon} />
                                <TextInput
                                    placeholder={t('email_placeholder')}
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={email}
                                    onChangeText={(val) => {
                                        setEmail(val);
                                        if (emailError) setEmailError('');
                                    }}
                                    onFocus={() => scrollToField(60)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={styles.input}
                                />
                            </View>
                            {emailError ? (
                                <View style={styles.errorRow}>
                                    <AlertCircle size={14} color="#dc2626" style={{ marginRight: 6 }} />
                                    <Text style={styles.errorText}>{emailError}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Password Input */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('password_lbl')}</Text>
                            <View collapsable={false} style={[
                                styles.inputWrapper,
                                passwordError ? styles.inputWrapperError : null
                            ]}>
                                <Lock size={18} color={passwordError ? '#ef4444' : '#1e3a8a'} style={styles.inputIcon} />
                                <TextInput
                                    placeholder={t('password_placeholder')}
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={password}
                                    onChangeText={(val) => {
                                        setPassword(val);
                                        if (passwordError) setPasswordError('');
                                    }}
                                    onFocus={() => scrollToField(220)}
                                    secureTextEntry={!showPassword}
                                    style={styles.input}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#94a3b8" />}
                                </TouchableOpacity>
                            </View>
                            {passwordError ? (
                                <View style={styles.errorRow}>
                                    <AlertCircle size={14} color="#dc2626" style={{ marginRight: 6 }} />
                                    <Text style={styles.errorText}>{passwordError}</Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.submitBtn,
                                pressed && styles.submitBtnPressed
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitBtnText}>{t('login_title')}</Text>
                            )}
                        </Pressable>

                        <TouchableOpacity
                            style={styles.forgotBtn}
                            onPress={() => Alert.alert('Forgot Password', 'Please contact administrator for password reset.')}
                        >
                            <Text style={styles.forgotText}>{t('forgot_password')}</Text>
                        </TouchableOpacity>

                        <View style={styles.registerRow}>
                            <Text style={styles.registerLabel}>{t('already_have_account')} </Text>
                            <TouchableOpacity onPress={() => navigation && navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>{t('create_account')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardWrapper>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    bgImage: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    bgImageStyle: {
        opacity: 0.12,
    },
    container: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 40,
        paddingBottom: 80,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    animatedWrapper: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 28,
        width: '100%',
    },
    logoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#f59e0b',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 28,
        elevation: 8,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    maintenanceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    maintenanceText: {
        color: '#991b1b',
        fontSize: 12,
        flex: 1,
        fontWeight: '500',
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 22,
    },
    loginTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    goldPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#fde68a',
        gap: 4,
    },
    goldPillText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#d97706',
    },
    roleChipsContainer: {
        marginBottom: 16,
    },
    roleSelectLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    roleChipsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    roleChip: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 6,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleChipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#1e3a8a',
    },
    roleChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    roleChipTextActive: {
        color: '#1e3a8a',
        fontWeight: 'bold',
    },
    hintBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginBottom: 10,
    },
    hintText: {
        fontSize: 12,
        color: '#1e40af',
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        height: 52,
    },
    inputWrapperError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 4,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 12,
        fontWeight: '600',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#0f172a',
        borderWidth: 0,
        height: '100%',
        paddingVertical: 0,
    },
    eyeBtn: {
        padding: 6,
    },
    submitBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
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
    forgotBtn: {
        alignItems: 'center',
        marginTop: 16,
    },
    forgotText: {
        color: '#1e3a8a',
        fontSize: 13,
        fontWeight: '600',
    },
    registerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    registerLabel: {
        color: '#64748b',
        fontSize: 14,
    },
    registerLink: {
        color: '#d97706',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default Login;
