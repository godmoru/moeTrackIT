import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { api } from '../services/api';
import { Assessment } from '../types';
import { formatCurrency } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentDetail'>;

export function AssessmentDetailsScreen({ route, navigation }: Props) {
    const { assessmentId } = route.params;
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAssessment();
    }, [assessmentId]);

    async function loadAssessment() {
        try {
            setLoading(true);
            const data = await api.getAssessment(assessmentId);
            setAssessment(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load assessment details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }

    if (loading || !assessment) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return { bg: '#dcfce7', text: '#166534' };
            case 'partial':
                return { bg: '#dbeafe', text: '#1e40af' };
            case 'overdue':
                return { bg: '#fee2e2', text: '#991b1b' };
            default:
                return { bg: '#fef3c7', text: '#92400e' };
        }
    };

    const statusStyle = getStatusColor(assessment.status);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Assessment Amount</Text>
                    <Text style={styles.amountValue}>
                        {formatCurrency(assessment.amountAssessed)}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {assessment.status}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Payer</Text>
                    <Text style={styles.value}>
                        {assessment.entity?.name || '-'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Revenue Item</Text>
                    <Text style={styles.value}>
                        {assessment.incomeSource?.name || '-'}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Created Date</Text>
                    <Text style={styles.value}>
                        {new Date(assessment.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Due Date</Text>
                    <Text style={styles.value}>
                        {new Date(assessment.dueDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Income Source Description</Text>
                <Text style={styles.description}>
                    {assessment.incomeSource?.description || 'No description available.'}
                </Text>
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
    description: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
});
