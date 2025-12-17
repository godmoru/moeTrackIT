import React from '../../_node_modules/@types/react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Payment } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface PaymentItemProps {
  payment: Payment;
  onPress?: () => void;
}

const methodIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  transfer: 'swap-horizontal-outline',
  pos: 'card-outline',
  cheque: 'document-text-outline',
};

export function PaymentItem({ payment, onPress }: PaymentItemProps) {
  const icon = methodIcons[payment.method] || 'cash-outline';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#059669" />
      </View>
      <View style={styles.content}>
        <Text style={styles.entity} numberOfLines={1}>
          {payment.assessment?.entity?.name || 'Unknown Entity'}
        </Text>
        <Text style={styles.source} numberOfLines={1}>
          {payment.assessment?.incomeSource?.name || 'Unknown Source'}
        </Text>
        <Text style={styles.date}>{formatDate(payment.paymentDate)}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>{formatCurrency(payment.amountPaid)}</Text>
        <View style={styles.methodBadge}>
          <Text style={styles.methodText}>{payment.method}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
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
  date: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  methodBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  methodText: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
});
