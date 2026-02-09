import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { Payment } from '../types';
import { Button } from '../components';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentDetail'>;

const API_BASE = 'http://192.168.78.59:5000/api/v1'; // Should match api.ts

export function PaymentDetailsScreen({ route, navigation }: Props) {
    const { paymentId } = route.params;
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadPayment();
    }, [paymentId]);

    async function loadPayment() {
        try {
            setLoading(true);
            const data = await api.getPayment(paymentId);
            setPayment(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load payment details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }

    async function handleDownloadReceipt() {
        if (!payment) return;

        try {
            setDownloading(true);
            const token = await api.getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (Platform.OS === 'web') {
                // Web implementation using fetch and Blob
                const response = await fetch(`${API_BASE}/payments/${payment.id}/invoice.pdf`, {
                    headers: headers as any,
                });

                if (!response.ok) throw new Error('Failed to download receipt');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `receipt_${payment.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                return;
            }

            // Native implementation
            const fileUri = `${FileSystem.documentDirectory}receipt_${payment.id}.pdf`;

            const downloadRes = await FileSystem.downloadAsync(
                `${API_BASE}/payments/${payment.id}/invoice.pdf`,
                fileUri,
                { headers }
            );

            if (downloadRes.status !== 200) {
                throw new Error('Failed to download receipt');
            }

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(downloadRes.uri);
            } else {
                Alert.alert('Success', 'Receipt downloaded to ' + downloadRes.uri);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', 'Failed to download receipt');
        } finally {
            setDownloading(false);
        }
    }

    if (loading || !payment) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Amount Paid</Text>
                    <Text style={styles.amountValue}>
                        {formatCurrency(payment.amountPaid)}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.statusText, { color: '#166534' }]}>
                        Successful
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Information</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Reference</Text>
                    <Text style={styles.value}>{payment.reference || '-'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Method</Text>
                    <Text style={styles.value}>{payment.method}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Recorded By</Text>
                    <Text style={styles.value}>
                        {payment.recorder?.name || 'Unknown'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assessment Details</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Payer</Text>
                    <Text style={styles.value}>
                        {payment.assessment?.entity?.name || '-'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Revenue Item</Text>
                    <Text style={styles.value}>
                        {payment.assessment?.incomeSource?.name || '-'}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title={downloading ? 'Downloading...' : 'Download Receipt'}
                    onPress={handleDownloadReceipt}
                    disabled={downloading}
                    leftIcon={<Ionicons name="download-outline" size={20} color="white" />}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1f2937',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
    },
    value: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
        maxWidth: '60%',
        textAlign: 'right',
    },
    footer: {
        marginTop: 24,
    },
});
