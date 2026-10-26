import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import Header from './layout/Header';
import Sidebar from './Sidebar';
import { useApp } from '../context/AppContext';

const Layout = ({ children, title, subtitle, navigation, currentRoute, onSearch }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { colors, isDark } = useApp();

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.bg }]}>
            <ImageBackground
                source={require('../assets/bg_pattern.png')}
                style={[styles.bgImage, { backgroundColor: colors.bg }]}
                imageStyle={[styles.bgImageStyle, { opacity: isDark ? 0.08 : 0.12 }]}
                resizeMode="cover"
            >
                <Header
                    title={title}
                    subtitle={subtitle}
                    onSearch={onSearch}
                    navigation={navigation}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                />

                <Sidebar
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    navigation={navigation}
                    currentRoute={currentRoute}
                />

                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {children}
                </KeyboardAvoidingView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    bgImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    bgImageStyle: {
        opacity: 0.12,
    },
    content: {
        flex: 1,
    }
});

export default Layout;
