import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { PaymentItem } from '../components/PaymentItem';
import { AssessmentItem } from '../components/AssessmentItem';
import { Card } from '../components';

type ReportType = 'daily' | 'monthly' | 'lga' | 'outstanding';

export function ReportDetailsScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { reportId, title } = route.params;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalAmount: 0, count: 0 });

    useEffect(() => {
        navigation.setOptions({ title });
        loadReportData();
    }, [reportId]);

    const loadReportData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            let res;
            let fetchedData: any[] = [];

            switch (reportId) {
                case '1': // Daily
                    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
                    res = await api.getPayments({ startDate: startOfDay, endDate: endOfDay, limit: 100 });
                    fetchedData = res.items;
                    break;
                case '2': // Monthly
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
                    res = await api.getPayments({ startDate: startOfMonth, endDate: endOfMonth, limit: 100 });
                    fetchedData = res.items;
                    break;
                case '3': // LGA
                    // LGA Remittance from start of year
                    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
                    res = await api.getLgaRemittance(startOfYear, now.toISOString());
                    fetchedData = res.items; // items: { lga: string, totalAmount: number }[]
                    break;
                case '4': // Outstanding assessments
                    res = await api.getAssessments({ status: 'pending', limit: 100 });
                    fetchedData = res.items;
                    break;
            }

            setData(fetchedData);

            // Calculate Stats
            let total = 0;
            if (reportId === '3') {
                total = fetchedData.reduce((sum: number, item: any) => sum + Number(item.totalAmount || 0), 0);
            } else if (reportId === '4') {
                total = fetchedData.reduce((sum: number, item: any) => sum + Number(item.amountAssessed || 0), 0);
            } else {
                total = fetchedData.reduce((sum: number, item: any) => sum + Number(item.amountPaid || 0), 0);
            }
            setStats({ totalAmount: total, count: fetchedData.length });

        } catch (error) {
            console.error('Failed to load report:', error);
            Alert.alert('Error', 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            if (data.length === 0) {
                Alert.alert('No Data', 'There is no data to export.');
                return;
            }

            let csvHeader = '';
            let csvRows = '';

            if (reportId === '1' || reportId === '2') {
                csvHeader = 'ID,Reference,Amount,Date,Method,Payer\n';
                csvRows = data.map((item: any) =>
                    `${item.id},"${item.reference || ''}",${item.amountPaid},"${item.paymentDate}",${item.method},"${item.id}"` // Assuming payer info might be nested or just using ID for now
                ).join('\n');
            } else if (reportId === '3') {
                csvHeader = 'LGA,Total Remittance\n';
                csvRows = data.map((item: any) =>
                    `"${item.lga}",${item.totalAmount}`
                ).join('\n');
            } else if (reportId === '4') {
                csvHeader = 'ID,Amount Assessed,Status,Due Date\n';
                csvRows = data.map((item: any) =>
                    `${item.id},${item.amountAssessed},${item.status},"${item.dueDate}"`
                ).join('\n');
            }

            const csvContent = csvHeader + csvRows;
            const filename = `Report_${title.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;

            if (Platform.OS === 'web') {
                // Web download
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                // Mobile share
                const fileUri = FileSystem.documentDirectory + filename;
                await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
                await Sharing.shareAsync(fileUri);
            }

        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Error', 'Failed to export report.');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        if (reportId === '1' || reportId === '2') {
            return <PaymentItem payment={item} onPress={() => { }} />;
        } else if (reportId === '4') {
            return <AssessmentItem assessment={item} onPress={() => { }} />;
        } else if (reportId === '3') {
            // Custom LGA row
            return (
                <Card style={styles.lgaCard}>
                    <View style={styles.lgaIcon}>
                        <Ionicons name="map" size={20} color="#059669" />
                    </View>
                    <View style={styles.lgaContent}>
                        <Text style={styles.lgaName}>{item.lga}</Text>
                        <Text style={styles.lgaAmount}>{formatCurrency(item.totalAmount)}</Text>
                    </View>
                </Card>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.statsCard}>
                    <Text style={styles.statsLabel}>Total Value</Text>
                    <Text style={styles.statsValue}>{formatCurrency(stats.totalAmount)}</Text>
                    <Text style={styles.statsCount}>{stats.count} records found</Text>
                </View>
                <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                    <Ionicons name="download-outline" size={20} color="#fff" />
                    <Text style={styles.exportText}>Export CSV</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={data}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No data available for this report.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsCard: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
    },
    statsValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginVertical: 2,
    },
    statsCount: {
        fontSize: 12,
        color: '#059669',
    },
    exportButton: {
        backgroundColor: '#059669',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    exportText: {
        color: '#fff',
        marginLeft: 4,
        fontWeight: '600',
        fontSize: 14,
    },
    list: {
        padding: 16,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    },
    lgaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    lgaIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    lgaContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lgaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    lgaAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },
});
