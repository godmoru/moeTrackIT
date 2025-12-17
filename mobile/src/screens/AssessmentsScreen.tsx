import React, { useEffect, useState, useCallback } from '../../_node_modules/@types/react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { AssessmentItem } from '../components';
import { Assessment } from '../types';
import { formatCurrency } from '../utils/format';

const STATUS_FILTERS = ['all', 'pending', 'partial', 'paid', 'overdue'];

export function AssessmentsScreen() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadAssessments = useCallback(
    async (pageNum: number, refresh = false) => {
      try {
        const res = await api.getAssessments({
          page: pageNum,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        const items = res.items || [];

        if (refresh) {
          setAssessments(items);
        } else {
          setAssessments((prev) => [...prev, ...items]);
        }

        setTotal(res.total || 0);
        setHasMore(items.length === 20);
      } catch (error) {
        console.error('Failed to load assessments:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadAssessments(1, true);
  }, [loadAssessments, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadAssessments(1, true);
  }, [loadAssessments]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadAssessments(nextPage);
    }
  }, [loading, hasMore, page, loadAssessments]);

  const totalAmount = assessments.reduce(
    (sum, a) => sum + Number(a.amountAssessed || 0),
    0
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total Assessments</Text>
            <Text style={styles.summaryValue}>{total}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === item && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(item)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === item && styles.filterChipTextActive,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
      <Text style={styles.emptyText}>No assessments found</Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#059669" />
      </View>
    );
  };

  if (loading && assessments.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={assessments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AssessmentItem assessment={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  filterList: {
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    marginTop: 12,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
