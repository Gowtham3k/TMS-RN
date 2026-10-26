import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, Animated, Platform } from 'react-native';
import { Shield } from 'lucide-react-native';
import storage from '../utils/storage';

const SplashScreen = ({ navigation }) => {
    const [secondsLeft, setSecondsLeft] = useState(5);
    const userStr = storage.getItem('user');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Entrance animation
        const useNative = Platform.OS !== 'web';
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: useNative,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: useNative,
            }),
        ]).start();

        // 5-second loading countdown for UI progress bar
        const interval = setInterval(() => {
            setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);

        // Safe navigation timeout outside React state updaters
        const navTimer = setTimeout(() => {
            navigation.navigate(userStr ? 'Home' : 'Login');
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(navTimer);
        };
    }, []);

    const progressPercent = ((5 - secondsLeft) / 5) * 100;

    return (
        <View style={styles.fullContainer}>
            <ImageBackground
                source={require('../assets/bg_pattern.png')}
                style={styles.fullScreenBg}
                imageStyle={styles.bgImageStyle}
                resizeMode="cover"
            >
                {/* Dark vignette overlay for contrast and clarity */}
                <View style={styles.vignetteOverlay}>
                    <Animated.View
                        style={[
                            styles.contentContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* Glowing Shield Emblem */}
                        <View style={styles.logoBadge}>
                            <Shield size={56} color="#f59e0b" />
                        </View>

                        {/* TMS Main Title */}
                        <Text style={styles.mainTitle}>TMS</Text>
                        <Text style={styles.subTitle}>Ticket Management System</Text>
                        <View style={styles.goldLine} />

                        {/* Descriptive Content */}
                        <Text style={styles.description}>
                            Automated Infrastructure Security, Smart Ticket Complaint Resolution & Real-time Audit Platform
                        </Text>

                        {/* Circular Loading Spinner (No Seconds Displayed) */}
                        <View style={styles.loaderWrapper}>
                            <View style={styles.circleOuter}>
                                <ActivityIndicator size="large" color="#f59e0b" style={styles.spinner} />
                            </View>
                        </View>

                        {/* Minimal Progress Bar */}
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                        </View>
                        <Text style={styles.loadingText}>Loading Login Environment ({Math.round(progressPercent)}%)</Text>
                    </Animated.View>
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#070a1e',
        overflow: 'hidden',
        ...(Platform.OS === 'web' ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            minHeight: '100vh',
        } : {}),
    },
    fullScreenBg: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    bgImageStyle: {
        width: '100%',
        height: '100%',
        opacity: 0.85,
        resizeMode: 'cover',
    },
    vignetteOverlay: {
        width: '100%',
        height: '100%',
        flex: 1,
        backgroundColor: 'rgba(7, 10, 30, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 520,
        alignItems: 'center',
        paddingVertical: 20,
    },
    logoBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#f59e0b',
        marginBottom: 20,
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    mainTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 4,
        marginBottom: 4,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fbbf24',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    goldLine: {
        width: 80,
        height: 4,
        backgroundColor: '#f59e0b',
        borderRadius: 2,
        marginBottom: 20,
    },
    description: {
        fontSize: 15,
        color: '#e2e8f0',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 440,
        marginBottom: 28,
        fontWeight: '500',
    },
    loaderWrapper: {
        marginBottom: 24,
        alignItems: 'center',
    },
    circleOuter: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 3,
        borderColor: 'rgba(245, 158, 11, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    spinner: {
        transform: [{ scale: 1.5 }],
    },
    progressTrack: {
        width: 240,
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#f59e0b',
        borderRadius: 3,
    },
    loadingText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '500',
    }
});

export default SplashScreen;
