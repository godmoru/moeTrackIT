import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: 'green' | 'blue' | 'purple' | 'orange';
  trend?: number;
}

const colorMap = {
  green: { bg: '#dcfce7', icon: '#16a34a', text: '#166534' },
  blue: { bg: '#dbeafe', icon: '#2563eb', text: '#1e40af' },
  purple: { bg: '#ede9fe', icon: '#7c3aed', text: '#5b21b6' },
  orange: { bg: '#ffedd5', icon: '#ea580c', text: '#9a3412' },
};

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={24} color={colors.icon} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
        {trend !== undefined && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={trend >= 0 ? '#16a34a' : '#dc2626'}
            />
            <Text
              style={[
                styles.trendText,
                { color: trend >= 0 ? '#16a34a' : '#dc2626' },
              ]}
            >
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
