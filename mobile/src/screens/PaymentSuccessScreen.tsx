import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen({ route, navigation }: Props) {
    const { gateway, reference, assessmentId, amount } = route.params;

    const scaleAnim = new Animated.Value(0);
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 60,
                friction: 6,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    function handleDone() {
        // Pop back to the assessments list (pop 3 screens: Success → WebView → RecordPayment → AssessmentDetail)
        navigation.popToTop();
    }

    function handleViewPayments() {
        navigation.popToTop();
        // Navigate to payments tab — handled by popToTop + user navigating
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Animated checkmark */}
                <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.checkmark}>✓</Text>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.subtitle}>
                        Your payment has been processed and confirmed.
                    </Text>

                    {/* Details Card */}
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gateway</Text>
                            <Text style={styles.detailValue}>
                                {gateway === 'remita' ? 'Remita' : 'Paystack'}
                            </Text>
                        </View>
                        {reference && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference</Text>
                                <Text style={[styles.detailValue, styles.reference]} numberOfLines={1}>
                                    {reference}
                                </Text>
                            </View>
                        )}
                        {amount != null && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Amount Paid</Text>
                                <Text style={[styles.detailValue, styles.amount]}>
                                    ₦{Number(amount).toLocaleString()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Status</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>Confirmed</Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity style={styles.primaryButton} onPress={handleDone}>
                        <Text style={styles.primaryButtonText}>Done</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleViewPayments}>
                        <Text style={styles.secondaryButtonText}>View Payment History</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    iconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#15803d',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#15803d',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    checkmark: {
        fontSize: 48,
        color: '#fff',
        fontWeight: '700',
        lineHeight: 56,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#14532d',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#4b7c5e',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 20,
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        width: '100%',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    reference: {
        fontSize: 11,
        color: '#374151',
        fontFamily: 'monospace',
    },
    amount: {
        color: '#15803d',
        fontSize: 15,
    },
    statusBadge: {
        backgroundColor: '#dcfce7',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#15803d',
    },
    primaryButton: {
        backgroundColor: '#15803d',
        borderRadius: 12,
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#15803d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        borderWidth: 1.5,
        borderColor: '#15803d',
        borderRadius: 12,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#15803d',
        fontSize: 14,
        fontWeight: '600',
    },
});
