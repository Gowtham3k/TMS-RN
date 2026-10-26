import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { Send } from 'lucide-react-native';

const SupportCenter = ({ navigation }) => {
    const { t, colors, isDark } = useApp();
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { type: 'bot', text: 'Hello! I am your Support Assistant. How can I help you today?' }
    ]);

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;

        const newHistory = [...chatHistory, { type: 'user', text: chatMessage }];
        setChatHistory(newHistory);
        setChatMessage('');

        setTimeout(() => {
            setChatHistory(prev => [...prev, {
                type: 'bot',
                text: "Thank you for your message. A technical representative will be with you shortly."
            }]);
        }, 1000);
    };

    return (
        <Layout
            title={t('support_center_title')}
            subtitle={t('support_center_subtitle')}
            navigation={navigation}
            currentRoute="SupportCenter"
        >
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.chatList} keyboardShouldPersistTaps="handled">
                    {chatHistory.map((msg, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.msgBubble,
                                msg.type === 'bot'
                                    ? [styles.botBubble, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]
                                    : [styles.userBubble, { backgroundColor: colors.navy }]
                            ]}
                        >
                            <Text style={msg.type === 'bot' ? [styles.botText, { color: colors.textPrimary }] : styles.userText}>
                                {msg.text}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.inputBar}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                        placeholder={t('type_message')}
                        placeholderTextColor="#94a3b8"
                        value={chatMessage}
                        onChangeText={setChatMessage}
                    />
                    <Pressable
                        style={({ pressed }) => [
                            styles.sendBtn,
                            { backgroundColor: colors.navy },
                            pressed && styles.sendBtnPressed
                        ]}
                        onPress={handleSendMessage}
                    >
                        <Send size={18} color="#f59e0b" />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    chatList: {
        paddingBottom: 20,
        gap: 12,
    },
    msgBubble: {
        padding: 14,
        borderRadius: 18,
        maxWidth: '82%',
        elevation: 1,
    },
    botBubble: {
        backgroundColor: '#ffffff',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    userBubble: {
        backgroundColor: '#1e3a8a',
        alignSelf: 'flex-end',
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    botText: {
        color: '#0f172a',
        fontSize: 14,
        lineHeight: 20,
    },
    userText: {
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 20,
    },
    inputBar: {
        flexDirection: 'row',
        gap: 10,
        paddingTop: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        fontSize: 14,
        color: '#0f172a',
    },
    sendBtn: {
        width: 50,
        height: 50,
        backgroundColor: '#1e3a8a',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f59e0b',
        elevation: 2,
    },
    sendBtnPressed: {
        backgroundColor: '#1e40af',
        transform: [{ scale: 0.95 }],
    }
});

export default SupportCenter;
