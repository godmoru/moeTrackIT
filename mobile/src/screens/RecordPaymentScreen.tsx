import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { api } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordPayment'>;
type Gateway = 'remita' | 'paystack';

export function RecordPaymentScreen({ route, navigation }: Props) {
    const { assessmentId, amount, incomeSource } = route.params;

    const [paymentAmount, setPaymentAmount] = useState(amount ? amount.toString() : '');
    const [payerEmail, setPayerEmail] = useState('');
    const [payerName, setPayerName] = useState('');
    const [gateway, setGateway] = useState<Gateway>('remita');
    const [loading, setLoading] = useState(false);

    // Pre-fill user details from stored profile
    useEffect(() => {
        api.getProfile().then((user) => {
            if (user?.email) setPayerEmail(user.email);
            if (user?.name) setPayerName(user.name);
        }).catch(() => { });
    }, []);

    async function handlePay() {
        const amt = Number(paymentAmount);
        if (!paymentAmount || isNaN(amt) || amt <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
            return;
        }
        if (!payerEmail) {
            Alert.alert('Email Required', 'Please enter your email address for payment receipt.');
            return;
        }

        setLoading(true);
        try {
            if (gateway === 'paystack') {
                const data = await api.initializePayment({
                    assessmentId,
                    amount: amt,
                    email: payerEmail,
                    name: payerName,
                });
                if (data.authorizationUrl) {
                    navigation.navigate('PaymentWebView', {
                        url: data.authorizationUrl,
                        gateway: 'paystack',
                        reference: data.reference,
                        assessmentId,
                    });
                } else {
                    throw new Error('No payment URL received from Paystack');
                }
            } else {
                // Remita
                const data = await api.initializeRemitaPayment({
                    assessmentId,
                    amount: amt,
                    email: payerEmail,
                    name: payerName,
                });

                if (data.paymentUrl) {
                    navigation.navigate('PaymentWebView', {
                        url: data.paymentUrl,
                        gateway: 'remita',
                        reference: data.orderId,
                        assessmentId,
                    });
                } else if (data.rrr) {
                    // Legacy RRR flow — show RRR with copy option
                    Alert.alert(
                        'RRR Generated Successfully',
                        `Your Remita Retrieval Reference (RRR) is:\n\n${data.rrr}\n\nStep 1: Copy this RRR.\nStep 2: Visit any bank branch or pay online at remita.net.\nStep 3: After payment, return here or go to Payment History to verify your status.`,
                        [
                            { 
                                text: 'Go to History', 
                                onPress: () => navigation.navigate('Main') 
                            },
                            { text: 'OK', style: 'cancel' }
                        ]
                    );
                } else {
                    throw new Error('Invalid Remita initialization response');
                }
            }
        } catch (error: any) {
            Alert.alert('Payment Failed', error.message || 'Failed to initialize payment');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: '#f9fafb' }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.subtitle}>Payment for</Text>
                    <Text style={styles.title}>{incomeSource || 'Assessment'}</Text>
                    {amount != null && (
                        <Text style={styles.balance}>
                            ₦{Number(amount).toLocaleString()} outstanding
                        </Text>
                    )}
                </View>

                {/* Form Card */}
                <View style={styles.card}>
                    {/* Amount */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Payment Amount (₦)</Text>
                        <TextInput
                            style={styles.input}
                            value={paymentAmount}
                            onChangeText={setPaymentAmount}
                            placeholder="Enter amount"
                            keyboardType="numeric"
                            placeholderTextColor="#9ca3af"
                        />
                        <Text style={styles.hint}>You can make partial payments</Text>
                    </View>

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={payerEmail}
                            onChangeText={setPayerEmail}
                            placeholder="your@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Payer Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Payer Name</Text>
                        <TextInput
                            style={styles.input}
                            value={payerName}
                            onChangeText={setPayerName}
                            placeholder="Full name"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Gateway Selector */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Payment Gateway</Text>
                        <View style={styles.gatewayRow}>
                            {/* Remita */}
                            <TouchableOpacity
                                style={[
                                    styles.gatewayCard,
                                    gateway === 'remita' && styles.gatewayCardRemitaActive,
                                ]}
                                onPress={() => setGateway('remita')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.gatewayLetter, { color: '#ea580c' }]}>R</Text>
                                <Text style={styles.gatewayName}>Remita</Text>
                                {gateway === 'remita' && (
                                    <View style={styles.selectedBadgeRemita}>
                                        <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Paystack */}
                            <TouchableOpacity
                                style={[
                                    styles.gatewayCard,
                                    gateway === 'paystack' && styles.gatewayCardPaystackActive,
                                ]}
                                onPress={() => setGateway('paystack')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.gatewayLetter, { color: '#2563eb' }]}>P</Text>
                                <Text style={styles.gatewayName}>Paystack</Text>
                                {gateway === 'paystack' && (
                                    <View style={styles.selectedBadgePaystack}>
                                        <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Info Banner */}
                    <View style={styles.infoBanner}>
                        <Text style={styles.infoText}>
                            🔒 Secure Payment: You will be redirected to complete your payment via{' '}
                            <Text style={{ fontWeight: '700' }}>
                                {gateway === 'remita' ? 'Remita' : 'Paystack'}
                            </Text>.
                        </Text>
                    </View>

                    {/* Pay Button */}
                    <TouchableOpacity
                        style={[styles.payButton, loading && styles.payButtonDisabled]}
                        onPress={handlePay}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.payButtonText}>
                                Pay ₦{Number(paymentAmount || 0).toLocaleString()}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    balance: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#dc2626',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#fff',
    },
    hint: {
        marginTop: 4,
        fontSize: 10,
        color: '#9ca3af',
    },
    gatewayRow: {
        flexDirection: 'row',
        gap: 10,
    },
    gatewayCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    gatewayCardRemitaActive: {
        borderColor: '#f97316',
        backgroundColor: '#fff7ed',
    },
    gatewayCardPaystackActive: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    gatewayLetter: {
        fontSize: 22,
        fontWeight: '800',
    },
    gatewayName: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '600',
        color: '#374151',
    },
    selectedBadgeRemita: {
        marginTop: 4,
        backgroundColor: '#fed7aa',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    selectedBadgePaystack: {
        marginTop: 4,
        backgroundColor: '#bfdbfe',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    selectedBadgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#374151',
    },
    infoBanner: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 11,
        color: '#1e40af',
        lineHeight: 16,
    },
    payButton: {
        backgroundColor: '#15803d',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
});
