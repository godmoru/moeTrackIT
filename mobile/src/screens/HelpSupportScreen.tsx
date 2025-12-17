import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';

export function HelpSupportScreen() {
    const handleEmail = () => {
        Linking.openURL('mailto:support@moetrackit.benue.gov.ng');
    };

    const handleCall = () => {
        if (Platform.OS !== 'web') {
            Linking.openURL('tel:+2348000000000');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>How can we help you?</Text>

            <View style={styles.grid}>
                <TouchableOpacity style={styles.optionCard} onPress={handleCall}>
                    <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                        <Ionicons name="call" size={24} color="#2563eb" />
                    </View>
                    <Text style={styles.optionTitle}>Call Support</Text>
                    <Text style={styles.optionSubtext}>Speak with an agent</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionCard} onPress={handleEmail}>
                    <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
                        <Ionicons name="mail" size={24} color="#059669" />
                    </View>
                    <Text style={styles.optionTitle}>Email Us</Text>
                    <Text style={styles.optionSubtext}>Get a response in 24h</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>

            <Card style={styles.faqCard}>
                <FAQItem
                    question="How do I reset my password?"
                    answer="Go to Profile > Change Password if logged in. If locked out, use 'Forgot Password' on the login screen."
                />
                <FAQItem
                    question="Why is my payment pending?"
                    answer="Payments may take a few minutes to reflect. If it takes longer than 24 hours, please contact support with your reference number."
                />
                <FAQItem
                    question="Can I download receipts?"
                    answer="Yes, navigate to any Payment Detail screen and tap the 'Download Receipt' button."
                />
            </Card>
        </ScrollView>
    );
}

const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <View style={styles.faqItem}>
        <Text style={styles.question}>{question}</Text>
        <Text style={styles.answer}>{answer}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    optionCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    optionSubtext: {
        fontSize: 12,
        color: '#6b7280',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    faqCard: {
        padding: 16,
    },
    faqItem: {
        marginBottom: 20,
    },
    question: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    answer: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
});
