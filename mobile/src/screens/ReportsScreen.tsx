import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';

const REPORTS = [
    { id: '1', title: 'Daily Revenue Report', description: 'Summary of daily collections', icon: 'today-outline' },
    { id: '2', title: 'Monthly Revenue Report', description: 'Detailed monthly analysis', icon: 'calendar-outline' },
    { id: '3', title: 'LGA Performance', description: 'Comparative analysis of LGAs', icon: 'map-outline' },
    { id: '4', title: 'Outstanding Assessments', description: 'List of unpaid assessments', icon: 'alert-circle-outline' },
];

export function ReportsScreen() {
    const navigation = useNavigation<any>();

    const handleDownload = (report: typeof REPORTS[0]) => {
        navigation.navigate('ReportDetails', { reportId: report.id, title: report.title });
    };

    const renderItem = ({ item }: { item: typeof REPORTS[0] }) => (
        <TouchableOpacity onPress={() => handleDownload(item)}>
            <Card style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={24} color="#059669" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#6b7280" />
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={REPORTS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#6b7280',
    },
});
