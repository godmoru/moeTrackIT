import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  amount?: number;
  date: string;
  type: 'assessment' | 'payment' | 'lga' | 'institution' | 'user';
  icon: string;
}

const REPORTS = [
    { id: '1', title: 'Daily Revenue Report', description: 'Summary of daily collections', icon: 'today-outline' },
    { id: '2', title: 'Monthly Revenue Report', description: 'Detailed monthly analysis', icon: 'calendar-outline' },
    { id: '3', title: 'LGA Performance', description: 'Comparative analysis of LGAs', icon: 'map-outline' },
    { id: '4', title: 'Outstanding Assessments', description: 'List of unpaid assessments', icon: 'alert-circle-outline' },
];

export function ReportsScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        loadReports();
    }, [user, selectedTab]);

    const loadReports = async () => {
        try {
            setLoading(true);
            let reportData: ReportItem[] = [];

            if (user?.role === 'area_education_officer') {
                // AEO reports
                if (selectedTab === 'overview') {
                    reportData = [
                        { id: '1', title: 'LGA Collection Summary', description: 'Total collections across your LGAs', amount: 2500000, date: '2024-12-17', type: 'lga', icon: 'location-outline' },
                        { id: '2', title: 'School Compliance Report', description: 'School assessment compliance status', date: '2024-12-17', type: 'institution', icon: 'business-outline' },
                        { id: '3', title: 'Payment Collection Rate', description: 'Collection efficiency by LGA', amount: 85.5, date: '2024-12-17', type: 'payment', icon: 'wallet-outline' }
                    ];
                } else if (selectedTab === 'lgas') {
                    reportData = [
                        { id: '1', title: 'LGA Performance', description: 'Performance metrics by LGA', amount: 500000, date: '2024-12-17', type: 'lga', icon: 'location-outline' },
                        { id: '2', title: 'LGA Ranking', description: 'LGAs ranked by collection', date: '2024-12-17', type: 'lga', icon: 'podium-outline' }
                    ];
                } else if (selectedTab === 'schools') {
                    reportData = [
                        { id: '1', title: 'School Assessment Status', description: 'Assessment status by school', date: '2024-12-17', type: 'institution', icon: 'business-outline' },
                        { id: '2', title: 'Outstanding Schools', description: 'Schools with pending assessments', date: '2024-12-17', type: 'institution', icon: 'alert-circle-outline' }
                    ];
                }
            } else if (['principal', 'cashier'].includes(user?.role || '')) {
                // Institution reports
                if (selectedTab === 'overview') {
                    reportData = [
                        { id: '1', title: 'Institution Summary', description: 'Your institution performance summary', amount: 150000, date: '2024-12-17', type: 'institution', icon: 'business-outline' },
                        { id: '2', title: 'Assessment History', description: 'Historical assessment records', date: '2024-12-17', type: 'assessment', icon: 'document-text-outline' },
                        { id: '3', title: 'Payment History', description: 'Historical payment records', amount: 120000, date: '2024-12-17', type: 'payment', icon: 'wallet-outline' }
                    ];
                } else if (selectedTab === 'assessments') {
                    reportData = [
                        { id: '1', title: 'Pending Assessments', description: 'Assessments awaiting payment', amount: 30000, date: '2024-12-17', type: 'assessment', icon: 'alert-circle-outline' },
                        { id: '2', title: 'Assessment Trends', description: 'Monthly assessment patterns', date: '2024-12-17', type: 'assessment', icon: 'trending-up-outline' }
                    ];
                } else if (selectedTab === 'payments') {
                    reportData = [
                        { id: '1', title: 'Payment History', description: 'All payment transactions', amount: 120000, date: '2024-12-17', type: 'payment', icon: 'wallet-outline' },
                        { id: '2', title: 'Payment Methods', description: 'Breakdown by payment type', date: '2024-12-17', type: 'payment', icon: 'card-outline' }
                    ];
                }
            } else if (['super_admin', 'admin', 'officer'].includes(user?.role || '')) {
                // Admin reports
                if (selectedTab === 'overview') {
                    reportData = [
                        { id: '1', title: 'Statewide Collections', description: 'Total collections across state', amount: 10000000, date: '2024-12-17', type: 'lga', icon: 'location-outline' },
                        { id: '2', title: 'System Performance', description: 'Overall system metrics', date: '2024-12-17', type: 'institution', icon: 'stats-chart-outline' },
                        { id: '3', title: 'User Activity', description: 'User login and activity metrics', date: '2024-12-17', type: 'user', icon: 'people-outline' }
                    ];
                } else if (selectedTab === 'lgas') {
                    reportData = [
                        { id: '1', title: 'LGA Performance', description: 'All LGAs performance metrics', amount: 10000000, date: '2024-12-17', type: 'lga', icon: 'location-outline' },
                        { id: '2', title: 'LGA Compliance', description: 'Compliance status by LGA', date: '2024-12-17', type: 'lga', icon: 'checkmark-circle-outline' }
                    ];
                } else if (selectedTab === 'users') {
                    reportData = [
                        { id: '1', title: 'User Activity Report', description: 'User login and activity metrics', date: '2024-12-17', type: 'user', icon: 'people-outline' },
                        { id: '2', title: 'Role Distribution', description: 'Users by role and permissions', date: '2024-12-17', type: 'user', icon: 'person-outline' }
                    ];
                }
            }

            setReports(reportData);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTabs = () => {
        if (user?.role === 'area_education_officer') {
            return [
                { key: 'overview', label: 'Overview' },
                { key: 'lgas', label: 'LGAs' },
                { key: 'schools', label: 'Schools' }
            ];
        } else if (['principal', 'cashier'].includes(user?.role || '')) {
            return [
                { key: 'overview', label: 'Overview' },
                { key: 'assessments', label: 'Assessments' },
                { key: 'payments', label: 'Payments' }
            ];
        } else if (['super_admin', 'admin', 'officer'].includes(user?.role || '')) {
            return [
                { key: 'overview', label: 'Overview' },
                { key: 'lgas', label: 'LGAs' },
                { key: 'users', label: 'Users' }
            ];
        }
        return [];
    };

    const handleDownload = (report: ReportItem) => {
        Alert.alert(
            'Download Report',
            `Would you like to download "${report.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Download', onPress: () => {
                    // TODO: Implement actual download functionality
                    console.log('Downloading report:', report.title);
                }}
            ]
        );
    };

    const renderItem = ({ item }: { item: ReportItem }) => (
        <TouchableOpacity onPress={() => handleDownload(item)}>
            <Card style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={24} color="#059669" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                    <View style={styles.meta}>
                        <Text style={styles.date}>{item.date}</Text>
                        {item.amount !== undefined && (
                            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                        )}
                    </View>
                </View>
                <Ionicons name="download-outline" size={20} color="#6b7280" />
            </Card>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }

    const tabs = getTabs();

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Reports</Text>
                <Text style={styles.subtitle}>
                    {user?.role === 'area_education_officer' ? 'LGA Reports' :
                        ['principal', 'cashier'].includes(user?.role || '') ? 'Institution Reports' :
                            'System Reports'}
                </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
                        onPress={() => setSelectedTab(tab.key)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Reports List */}
            <View style={styles.list}>
                {reports.map(report => (
                    <TouchableOpacity key={report.id} onPress={() => handleDownload(report)}>
                        <Card style={styles.card}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={report.icon as any} size={24} color="#059669" />
                            </View>
                            <View style={styles.content}>
                                <Text style={styles.title}>{report.title}</Text>
                                <Text style={styles.description}>{report.description}</Text>
                                <View style={styles.meta}>
                                    <Text style={styles.date}>{report.date}</Text>
                                    {report.amount !== undefined && (
                                        <Text style={styles.amount}>{formatCurrency(report.amount)}</Text>
                                    )}
                                </View>
                            </View>
                            <Ionicons name="download-outline" size={20} color="#6b7280" />
                        </Card>
                    </TouchableOpacity>
                ))}
            </View>

            {reports.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>No reports available</Text>
                </View>
            )}
        </ScrollView>
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        padding: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#059669',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    date: {
        fontSize: 12,
        color: '#9ca3af',
    },
    amount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 12,
    },
});
