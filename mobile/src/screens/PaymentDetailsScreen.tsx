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

    async function handleVerifyPayment() {
        if (!payment) return;
        try {
            setLoading(true);
            let result;
            if (payment.method === 'remita' || payment.rrr) {
                result = await api.verifyRemitaPayment(payment.rrr || payment.reference || '');
            } else {
                result = await api.verifyPaystackPayment(payment.reference || '');
            }

            if (result.status === 'success' || result.status === 'paid' || result.status === '00' || result.status === '01') {
                Alert.alert('Success', 'Payment verified and confirmed!');
                loadPayment(); // Reload data
            } else {
                Alert.alert('Pending', `Payment status: ${result.message || 'Pending'}`);
            }
        } catch (error: any) {
            Alert.alert('Verification Error', error.message || 'Could not verify payment');
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
                const response = await fetch(`${api.API_BASE}/payments/${payment.id}/invoice.pdf`, {
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
                `${api.API_BASE}/payments/${payment.id}/invoice.pdf`,
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
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: payment.status === 'paid' || payment.status === 'confirmed' ? '#dcfce7' : (payment.status === 'failed' ? '#fee2e2' : '#fef3c7') }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: payment.status === 'paid' || payment.status === 'confirmed' ? '#166534' : (payment.status === 'failed' ? '#991b1b' : '#92400e') }
                    ]}>
                        {payment.status || 'Pending'}
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

                {payment.rrr && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Remita RRR</Text>
                        <Text style={[styles.value, { fontWeight: '700', color: '#ea580c' }]}>{payment.rrr}</Text>
                    </View>
                )}

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
                {payment.status === 'pending' && (
                    <View style={{ marginBottom: 12 }}>
                        <Button
                            title="Verify Payment Status"
                            onPress={handleVerifyPayment}
                            variant="secondary"
                            leftIcon={<Ionicons name="refresh-outline" size={20} color="#059669" />}
                        />
                    </View>
                )}
                <Button
                    title={downloading ? 'Downloading...' : 'Download Receipt'}
                    onPress={handleDownloadReceipt}
                    disabled={downloading || payment.status === 'pending'}
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
