import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Text,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { api } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentWebView'>;

export function PaymentWebViewScreen({ route, navigation }: Props) {
    const { url, gateway, reference, assessmentId } = route.params;
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const webViewRef = useRef<WebView>(null);

    // This URL will be used to detect when the payment is completed
    // We expect the backend to redirect to this or similar after Paystack/Remita
    const CALLBACK_URL_PATTERN = '/admin/payments/verify';

    async function handleVerifyPayment() {
        if (verifying) return;
        setVerifying(true);
        try {
            const token = await api.getToken();
            const endpoint = gateway === 'paystack'
                ? `${api.API_BASE}/payments/verify/${reference}`
                : `${api.API_BASE}/payments/remita/verify/${reference}`;

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.status === 'success' || res.ok) {
                navigation.replace('PaymentSuccess', {
                    gateway,
                    reference: reference || '',
                    assessmentId,
                    amount: data.amount,
                });
            } else {
                throw new Error(data.message || 'Payment not confirmed yet.');
            }
        } catch (err: any) {
            setVerifying(false);
            Alert.alert(
                'Verification',
                err.message || 'We could not verify your payment. If you have been debited, please contact support.',
                [{ text: 'OK' }]
            );
        }
    }

    const onNavigationStateChange = (navState: any) => {
        // Detect if we reached the callback URL
        if (navState.url.includes(CALLBACK_URL_PATTERN)) {
            handleVerifyPayment();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>SECURE PAYMENT</Text>
                    <Text style={styles.headerSubtitle}>{gateway.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={handleVerifyPayment} style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>Verify</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    onNavigationStateChange={onNavigationStateChange}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#15803d" />
                            <Text style={styles.loadingText}>Loading Payment Securely...</Text>
                        </View>
                    )}
                />

                {verifying && (
                    <View style={styles.verifyingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.verifyingText}>Verifying Payment...</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
    },
    confirmButton: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    confirmButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#15803d',
    },
    webviewContainer: {
        flex: 1,
        position: 'relative',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    verifyingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    verifyingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
});
