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
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.dueDate}>Due: {formatDate(assessment.dueDate)}</Text>
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
});
