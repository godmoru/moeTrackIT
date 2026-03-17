import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Assessment } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils/format';

interface AssessmentItemProps {
  assessment: Assessment;
  onPress?: () => void;
}

export function AssessmentItem({ assessment, onPress }: AssessmentItemProps) {
  const statusColors = getStatusColor(assessment.status);
  
  // Find successful payment to get RRR and date paid
  const successfulPayment = assessment.payments?.find(p => p.status === 'paid' || p.status === 'confirmed');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.entityContainer}>
          <Text style={styles.entity} numberOfLines={1}>
            {assessment.entity?.name || 'Unknown Entity'}
          </Text>
          <Text style={styles.source} numberOfLines={1}>
            {assessment.incomeSource?.name || 'Unknown Source'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {assessment.status}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>
            {formatCurrency(assessment.amountAssessed)}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          {assessment.status === 'paid' && successfulPayment ? (
            <View style={styles.paidInfo}>
              {successfulPayment.rrr && (
                <Text style={styles.rrrText}>RRR: {successfulPayment.rrr}</Text>
              )}
              <View style={styles.dateRow}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.paidDate}>Paid: {formatDate(successfulPayment.paymentDate)}</Text>
              </View>
            </View>
          ) : (
            <>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.dueDate}>Due: {formatDate(assessment.dueDate)}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entityContainer: {
    flex: 1,
    marginRight: 12,
  },
  entity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  source: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  amountContainer: {},
  amountLabel: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  paidInfo: {
    alignItems: 'flex-end',
  },
  rrrText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidDate: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
});
