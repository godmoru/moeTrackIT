import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lga?: string;
  entity?: string;
  lastLogin?: string;
}

export function UsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    loadUsers();
  }, [user, selectedTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      let userData: User[] = [];

      if (['super_admin', 'admin', 'officer'].includes(user?.role || '')) {
        userData = [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'area_education_officer',
            status: 'active',
            lga: 'Makurdi',
            lastLogin: '2024-12-17 10:30'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'principal',
            status: 'active',
            entity: 'Government Secondary School',
            lastLogin: '2024-12-17 09:15'
          },
          {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            role: 'cashier',
            status: 'inactive',
            entity: 'Primary School A',
            lastLogin: '2024-12-15 14:20'
          }
        ];
      }

      setUsers(userData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#7c3aed';
      case 'admin': return '#3b82f6';
      case 'officer': return '#10b981';
      case 'area_education_officer': return '#f59e0b';
      case 'principal': return '#ef4444';
      case 'cashier': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#10b981' : '#ef4444';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'officer': return 'Officer';
      case 'area_education_officer': return 'AEO';
      case 'principal': return 'Principal';
      case 'cashier': return 'Cashier';
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => 
    selectedTab === 'active' ? user.status === 'active' :
    selectedTab === 'inactive' ? user.status === 'inactive' :
    true
  );

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
          </View>
          <Text style={styles.lastLogin}>Last login: {item.lastLogin}</Text>
        </View>
        {item.lga && (
          <Text style={styles.location}>LGA: {item.lga}</Text>
        )}
        {item.entity && (
          <Text style={styles.location}>Institution: {item.entity}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>Manage system users and permissions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
            Active ({users.filter(u => u.status === 'active').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'inactive' && styles.activeTab]}
          onPress={() => setSelectedTab('inactive')}
        >
          <Text style={[styles.tabText, selectedTab === 'inactive' && styles.activeTabText]}>
            Inactive ({users.filter(u => u.status === 'inactive').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No {selectedTab} users found</Text>
          </View>
        }
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  userMeta: {
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  lastLogin: {
    fontSize: 12,
    color: '#9ca3af',
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
