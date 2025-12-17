import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/format';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type Props = NativeStackScreenProps<RootStackParamList, 'InstitutionDetail'>;

// Types based on the user's snippet
interface EntityDetail {
    id: number;
    name: string;
    code: string | null;
    type: string | null;
    subType: string | null;
    ownership: string | null;
    state: string | null;
    lga: string | null;
    status: string;
    category: string | null;
    address: string | null;
    contactPerson: string | null;
    contactPhone: string | null;
    contactEmail?: string | null;
    entityType?: { name: string };
    ownershipType?: { name: string };
}

interface AssessmentLite {
    id: number;
    entityId: number;
    assessmentPeriod?: string | null;
    incomeSourceId?: number | null;
    IncomeSource?: { name: string } | null;
    status?: string | null;
}

interface PaymentLite {
    id: number;
    assessmentId: number;
    amountPaid: number;
    paymentDate?: string | null;
    method?: string | null;
    reference?: string | null;
    status?: string | null;
}

export function InstitutionDetailsScreen({ route, navigation }: Props) {
    const { institutionId } = route.params;
    const [entity, setEntity] = useState<EntityDetail | null>(null);
    const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
    const [payments, setPayments] = useState<PaymentLite[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'revenue'>('overview');
    const [loading, setLoading] = useState(true);

    // Derived state
    const entityAssessments = assessments.filter((a) => a.entityId === Number(institutionId));
    const entityAssessmentIds = new Set(entityAssessments.map((a) => a.id));
    const entityPayments = payments.filter((p) => entityAssessmentIds.has(p.assessmentId));

    const totalRevenue = entityPayments.reduce(
        (sum, p) => sum + Number(p.amountPaid || 0),
        0
    );

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await api.getInstitution(institutionId);
                setEntity(data.entity);
                setAssessments(data.assessments);
                setPayments(data.payments);
            } catch (error) {
                console.error('Failed to load institution details:', error);
                Alert.alert('Error', 'Failed to load institution details');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [institutionId]);

    const handleDownloadReceipt = async (paymentId: number) => {
        try {
            if (Platform.OS === 'web') {
                // Web download logic
                const token = await api.getToken();
                const res = await fetch(`${api.API_BASE}/payments/${paymentId}/invoice.pdf`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error('Failed to download');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt-${paymentId}.pdf`;
                link.click();
            } else {
                // Native download logic
                const token = await api.getToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const fileUri = `${FileSystem.documentDirectory}receipt_${paymentId}.pdf`;

                const downloadRes = await FileSystem.downloadAsync(
                    `${api.API_BASE}/payments/${paymentId}/invoice.pdf`,
                    fileUri,
                    { headers }
                );

                if (downloadRes.status !== 200) {
                    throw new Error('Failed to download receipt');
                }

                if ((await Sharing.isAvailableAsync())) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    Alert.alert('Success', 'Receipt downloaded');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to download receipt');
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    if (!entity) {
        return (
            <View style={styles.container}>
                <Text>Institution not found.</Text>
            </View>
        );
    }

    // Yearly Revenue Calculation for Chart
    const yearlyRevenueMap = new Map<string, number>();
    entityAssessments.forEach((a) => {
        const year = (a.assessmentPeriod || "").toString() || "Unknown";
        const relatedPayments = entityPayments.filter((p) => p.assessmentId === a.id);
        const sumForAssessment = relatedPayments.reduce(
            (s, p) => s + Number(p.amountPaid || 0),
            0
        );
        const prev = yearlyRevenueMap.get(year) || 0;
        yearlyRevenueMap.set(year, prev + sumForAssessment);
    });
    const yearlyRows = Array.from(yearlyRevenueMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const maxRevenue = Math.max(...yearlyRows.map(r => r[1]), 1); // Avoid div by zero

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {['overview', 'assessments', 'revenue'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab as any)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderOverview = () => (
        <ScrollView style={styles.tabContent}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <DetailRow label="Name" value={entity.name} />
                <DetailRow label="Code" value={entity.code || '-'} />
                <DetailRow label="Type" value={entity.entityType?.name || entity.subType || entity.type || '-'} />
                <DetailRow label="Ownership" value={entity.ownershipType?.name || entity.ownership || '-'} />
                <DetailRow label="Category" value={entity.category || '-'} />
                <DetailRow label="Status" value={entity.status} capitalize />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Location</Text>
                <DetailRow label="State" value={entity.state || '-'} />
                <DetailRow label="LGA" value={entity.lga || '-'} />
                <DetailRow label="Address" value={entity.address || '-'} />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <DetailRow label="Contact Person" value={entity.contactPerson || '-'} />
                <DetailRow label="Phone" value={entity.contactPhone || '-'} />
                <DetailRow label="Email" value={entity.contactEmail || '-'} />
            </Card>
        </ScrollView>
    );

    const renderAssessments = () => (
        <ScrollView style={styles.tabContent}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Assessments ({entityAssessments.length})</Text>
                {entityAssessments.length === 0 ? (
                    <Text style={styles.emptyText}>No assessments found.</Text>
                ) : (
                    entityAssessments.map((item, index) => {
                        const relatedPayments = entityPayments.filter(p => p.assessmentId === item.id);
                        const paid = relatedPayments.reduce((s, p) => s + Number(p.amountPaid || 0), 0);

                        return (
                            <View key={item.id} style={[styles.itemRow, index < entityAssessments.length - 1 && styles.borderBottom]}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemTitle}>{item.IncomeSource?.name || 'Unknown Source'}</Text>
                                    <Text style={styles.itemStatus}>{item.status}</Text>
                                </View>
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemSubtext}>Year: {item.assessmentPeriod || '-'}</Text>
                                    <Text style={styles.itemAmount}>{formatCurrency(paid)}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </Card>
        </ScrollView>
    );

    const renderRevenue = () => (
        <ScrollView style={styles.tabContent}>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <Card style={styles.statsCard}>
                    <Text style={styles.statsLabel}>TOTAL REVENUE</Text>
                    <Text style={styles.statsValue}>{formatCurrency(totalRevenue)}</Text>
                </Card>
                <Card style={styles.statsCard}>
                    <Text style={styles.statsLabel}>PAYMENTS</Text>
                    <Text style={styles.statsValue}>{entityPayments.length}</Text>
                </Card>
            </View>

            {/* Chart */}
            {yearlyRows.length > 0 && (
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>Revenue by Year</Text>
                    <View style={styles.chartContainer}>
                        {yearlyRows.map(([year, amount]) => (
                            <View key={year} style={styles.chartBarWrapper}>
                                <View style={styles.barLabelContainer}>
                                    <Text style={styles.barLabel}>{year}</Text>
                                </View>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${(amount / maxRevenue) * 100}%` }]} />
                                </View>
                                <Text style={styles.barValue}>{formatCurrency(amount, true)}</Text>
                            </View>
                        ))}
                    </View>
                </Card>
            )}

            {/* Recent Payments */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                {entityPayments.length === 0 ? (
                    <Text style={styles.emptyText}>No payments found.</Text>
                ) : (
                    entityPayments.slice(0, 5).map((payment, index) => (
                        <TouchableOpacity
                            key={payment.id}
                            onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id })}
                            style={[styles.itemRow, index < Math.min(entityPayments.length, 5) - 1 && styles.borderBottom]}
                        >
                            <View style={styles.itemHeader}>
                                <Text style={styles.itemTitle}>Payment #{payment.id}</Text>
                                <Text style={styles.itemAmount}>{formatCurrency(payment.amountPaid)}</Text>
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemSubtext}>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</Text>
                                <Text style={[styles.itemStatus, { fontSize: 12 }]}>{payment.status}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </Card>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="business" size={32} color="#059669" />
                </View>
                <Text style={styles.headerName}>{entity.name}</Text>
                {entity.code && <Text style={styles.headerCode}>{entity.code}</Text>}
                <View style={[styles.statusBadge, entity.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, entity.status === 'active' ? styles.textActive : styles.textInactive]}>
                        {entity.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            {renderTabs()}

            <View style={{ flex: 1 }}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'assessments' && renderAssessments()}
                {activeTab === 'revenue' && renderRevenue()}
            </View>
        </View>
    );
}

// Helper Component for Details
const DetailRow = ({ label, value, capitalize }: { label: string; value: string | null; capitalize?: boolean }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, capitalize && { textTransform: 'capitalize' }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    headerCode: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: { backgroundColor: '#d1fae5' },
    statusInactive: { backgroundColor: '#fef3c7' },
    statusText: { fontSize: 12, fontWeight: '600' },
    textActive: { color: '#059669' },
    textInactive: { color: '#d97706' },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#059669',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#059669',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    itemRow: {
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
    itemStatus: { fontSize: 12, fontWeight: '500', color: '#059669', textTransform: 'capitalize' },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemSubtext: { fontSize: 12, color: '#6b7280' },
    itemAmount: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        fontStyle: 'italic',
        marginTop: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statsCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
    },
    statsLabel: { fontSize: 10, color: '#6b7280', fontWeight: '700', marginBottom: 8 },
    statsValue: { fontSize: 18, color: '#059669', fontWeight: '700' },

    chartContainer: {
        marginTop: 8,
    },
    chartBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    barLabelContainer: { width: 50 },
    barLabel: { fontSize: 12, color: '#6b7280' },
    barTrack: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, marginHorizontal: 8 },
    barFill: { height: '100%', backgroundColor: '#059669', borderRadius: 4 },
    barValue: { width: 60, fontSize: 12, color: '#1f2937', textAlign: 'right' },
});
