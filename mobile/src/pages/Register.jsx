import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable, ImageBackground, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import api from '../api';
import { useApp } from '../context/AppContext';
import storage from '../utils/storage';
import { User, Mail, Lock, Building, UserPlus, Eye, EyeOff } from 'lucide-react-native';

const Register = ({ navigation }) => {
    const { t } = useApp();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER', department: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const handleSubmit = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/register', formData);
            storage.setItem('token', res.data.token);
            storage.setItem('user', JSON.stringify(res.data.user));
            if (navigation) navigation.navigate('Home');
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.msg || err.response?.data?.error || 'Error creating account');
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
                    <View style={styles.headerArea}>
                        <View style={styles.logoBadge}>
                            <UserPlus size={26} color="#f59e0b" style={{ marginRight: 8 }} />
                            <Text style={styles.logoText}>Join TMS</Text>
                        </View>
                        <Text style={styles.title}>{t('create_account')}</Text>
                        <Text style={styles.subtitle}>{t('join_system')}</Text>
                    </View>

                    <View collapsable={false} style={styles.card}>
                        {/* Full Name */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('full_name')}</Text>
                            <View collapsable={false} style={styles.inputWrapper}>
                                <User size={18} color="#1e3a8a" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                    onFocus={() => scrollToField(60)}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('email_lbl')}</Text>
                            <View collapsable={false} style={styles.inputWrapper}>
                                <Mail size={18} color="#1e3a8a" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="john@example.com"
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                    onFocus={() => scrollToField(130)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        {/* Department */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('department')}</Text>
                            <View collapsable={false} style={styles.inputWrapper}>
                                <Building size={18} color="#1e3a8a" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. IT, Computer Science"
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={formData.department}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                                    onFocus={() => scrollToField(210)}
                                />
                            </View>
                        </View>

                        {/* Password */}
                        <View collapsable={false} style={styles.inputGroup}>
                            <Text style={styles.label}>{t('password_lbl')}</Text>
                            <View collapsable={false} style={styles.inputWrapper}>
                                <Lock size={18} color="#1e3a8a" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    selectionColor="#1e3a8a"
                                    value={formData.password}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                                    onFocus={() => scrollToField(300)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#94a3b8" />}
                                </TouchableOpacity>
                            </View>
                        </View>

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
                                <Text style={styles.submitBtnText}>{t('create_account')}</Text>
                            )}
                        </Pressable>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginLabel}>{t('already_have_account')} </Text>
                            <TouchableOpacity onPress={() => navigation && navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>{t('login_here')}</Text>
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
    headerArea: {
        alignItems: 'center',
        marginBottom: 24,
        maxWidth: 440,
        width: '100%',
    },
    logoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    logoText: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 24,
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
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 28,
        maxWidth: 440,
        width: '100%',
        elevation: 4,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    inputGroup: {
        marginBottom: 16,
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
    submitBtn: {
        backgroundColor: '#1e3a8a',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
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
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 22,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    loginLabel: {
        color: '#64748b',
        fontSize: 14,
    },
    loginLink: {
        color: '#d97706',
        fontSize: 14,
        fontWeight: 'bold',
    },
    eyeBtn: {
        padding: 6,
    }
});

export default Register;
