import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';

export function AboutScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/benue.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.appName}>MOETrackIT</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
            </View>

            <Card style={styles.card}>
                <Text style={styles.description}>
                    The Ministry of Education Tracking & Intelligence Tool (MOETrackIT) is a comprehensive revenue management system designed for the Benue State Ministry of Education.
                </Text>
                <Text style={styles.description}>
                    It facilitates transparent and efficient tracking of revenue collections, assessments, and remittances across all schools and educational institutions in the state.
                </Text>
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Developed By</Text>
                <Text style={styles.developer}>
                    Benue State Ministry of Education & Knowledge Management in partnership with GESUSoft Technology Ltd, Abuja - Nigeria
                </Text>
                <Text style={styles.copyright}>
                    © {new Date().getFullYear()} All Rights Reserved
                </Text>
            </Card>

            <View style={styles.links}>
                <TouchableOpacity onPress={() => Linking.openURL('https://moe.benuestate.gov.ng')}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={styles.dot}>•</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://moe.benuestate.gov.ng')}>
                    <Text style={styles.linkText}>Terms of Service</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: '#6b7280',
    },
    card: {
        width: '100%',
        padding: 20,
        marginBottom: 16,
    },
    description: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    developer: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 4,
    },
    copyright: {
        fontSize: 13,
        color: '#9ca3af',
    },
    links: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    dot: {
        marginHorizontal: 8,
        color: '#d1d5db',
    },
});
