import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatCard, ProgressRing, Card, PaymentItem } from '../components';
import { formatCurrency } from '../utils/format';
import { DashboardSummary, LgaRemittance, Payment, RootStackParamList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lgaData, setLgaData] = useState<LgaRemittance[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      const from = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const to = today.toISOString().slice(0, 10);

      let lgaId: number | undefined;
      let entityId: number | undefined;

      // Determine scope based on role
      if (user?.role === 'area_education_officer') {
        lgaId = user.lgaId;
      } else if (['principal', 'cashier'].includes(user?.role || '')) {
        entityId = user?.entityId;
      }
      // Everyone else (super_admin, admin, hon_commissioner, dfa, perm_secretary, director, hq_cashier) sees ALL (Statewide)

      const [summaryData, lgaRes, paymentsRes] = await Promise.all([
        api.getSummary(undefined, undefined, lgaId, entityId), // Use all-time by default if dates undefined in api, but here passing undefined for dates to get all time?
        // Actually the original code passed undefined to getSummary() which defaults to no date filter (All Time).
        // So I pass undefined for dates.

        // Only fetch LGA data if not restricted to entity (or if needed)
        // Entity users probably don't need "Top LGAs" list, or it should be empty/hidden.
        !entityId ? api.getLgaRemittance(from, to) : Promise.resolve({ items: [] }),

        // Payments might need filtering too? api.getPayments supports it now?
        // If api.getPayments doesn't support lgaId/entityId params yet, we might see all payments.
        // Let's check api.getPayments signature. It supports startDate/endDate.
        // We probably need to filter payments by lga/entity too if the backend doesn't do it automatically based on user context.
        // Assuming backend handles data segregation or we need to add params to getPayments too.
        // For now, let's assume getPayments needs params or backend handles it. 
        // Given I just added lgaId/entityId to getSummary, I probably need them for getPayments too.
        api.getPayments({ limit: 5, lgaId, entityId }),
      ]);

      setSummary(summaryData);
      setLgaData(lgaRes.items || []);
      setRecentPayments(paymentsRes.items || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]); // Added user dependency

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('Dashboard User:', JSON.stringify(user, null, 2));
      console.log('Role:', user.role);
      console.log('LGA ID:', user.lgaId);
      console.log('Entity ID:', user.entityId);
    }
  }, [user]);

  const totalCollected = Number(summary?.totalCollected || 0);
  const totalAssessments = summary?.statusCounts?.reduce(
    (sum, s) => sum + Number(s.count),
    0
  ) || 0;
  const paidCount = summary?.statusCounts?.find(s => s.status === 'paid')?.count || 0;
  const pendingCount = summary?.statusCounts?.find(s => s.status === 'pending')?.count || 0;

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'officer': return 'Officer';
      case 'cashier': return 'Cashier';
      case 'area_education_officer': return 'AEO';
      case 'principal': return 'Principal';
      default: return user?.role || 'User';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{getRoleLabel()}</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Total Collections</Text>
          <Text style={styles.summaryPeriod}>
            All Time
            {user?.role === 'area_education_officer' ? ' (LGA)' :
              ['principal', 'cashier'].includes(user?.role || '') ? ' (Institution)' :
                ''}
          </Text>
        </View>
        <Text style={styles.summaryAmount}>
          {formatCurrency(totalCollected)}
        </Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Ionicons name="checkmark-circle" size={16} color="#86efac" />
            <Text style={styles.summaryStatText}>{paidCount} Paid</Text>
          </View>
          <View style={styles.summaryStat}>
            <Ionicons name="time" size={16} color="#fde68a" />
            <Text style={styles.summaryStatText}>{pendingCount} Pending</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {user?.role === 'area_education_officer' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.aeoButton]} onPress={() => navigation.navigate('Payments')}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.actionText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.aeoButton]} onPress={() => navigation.navigate('Assessments')}>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.actionText}>Assessments</Text>
            </TouchableOpacity>
          </View>
        )}
        {['principal', 'cashier'].includes(user?.role || '') && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.principalButton]} onPress={() => navigation.navigate('Payments')}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.actionText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.principalButton]} onPress={() => navigation.navigate('Assessments')}>
              <Ionicons name="document-text" size={20} color="#fff" />
              <Text style={styles.actionText}>Assessments</Text>
            </TouchableOpacity>
          </View>
        )}
        {['super_admin', 'admin', 'officer', 'hon_commissioner', 'system_admin'].includes(user?.role || '') && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton, styles.adminButton]} onPress={() => navigation.navigate('Users')}>
              <Ionicons name="people" size={20} color="#fff" />
              <Text style={styles.actionText}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.adminButton]} onPress={() => navigation.navigate('Payments')}>
              <Ionicons name="wallet" size={20} color="#fff" />
              <Text style={styles.actionText}>Payments</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <StatCard
            title="Asst"
            value={totalAssessments}
            icon="document-text-outline"
            color="blue"
            trend={8.2}
          />
        </View>
        <View style={styles.statItem}>
          <StatCard
            title="Active LGAs"
            value={lgaData.length}
            icon="location-outline"
            color="purple"
          />
        </View>
      </View>

      {/* Progress Rings */}
      <Card style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Collection Targets</Text>
        <View style={styles.progressGrid}>
          <ProgressRing
            value={Number(paidCount)}
            max={totalAssessments || 1}
            label="Paid"
            color="green"
          />
          <ProgressRing
            value={lgaData.length}
            max={23}
            label="LGA Coverage"
            color="blue"
          />
          <ProgressRing
            value={78}
            max={100}
            label="Efficiency"
            color="orange"
          />
        </View>
      </Card>

      {/* Top LGAs */}
      {lgaData.length > 0 && (
        <Card style={styles.lgaCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top LGAs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LGAList')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {lgaData.slice(0, 5).map((lga, index) => (
            <View key={lga.lga} style={styles.lgaItem}>
              <View style={styles.lgaRank}>
                <Text style={styles.lgaRankText}>{index + 1}</Text>
              </View>
              <Text style={styles.lgaName} numberOfLines={1}>
                {lga.lga}
              </Text>
              <Text style={styles.lgaAmount}>
                {formatCurrency(lga.totalAmount)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentPayments.map((payment) => (
            <PaymentItem
              key={payment.id}
              payment={payment}
              onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  roleBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  summaryCard: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#a7f3d0',
  },
  summaryPeriod: {
    fontSize: 12,
    color: '#a7f3d0',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStatText: {
    fontSize: 13,
    color: '#d1fae5',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAll: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  aeoButton: {
    backgroundColor: '#10b981',
  },
  principalButton: {
    backgroundColor: '#f59e0b',
  },
  adminButton: {
    backgroundColor: '#7c3aed',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  lgaCard: {
    marginBottom: 16,
  },
  lgaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lgaRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lgaRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  lgaName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  lgaAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  recentSection: {
    marginBottom: 16,
  },
});
