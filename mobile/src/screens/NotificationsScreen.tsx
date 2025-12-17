import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';

interface Notification {
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
    type: 'info' | 'alert' | 'success';
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Payment Successful',
        message: 'Your payment of ₦50,000 for Benue State University was verified.',
        date: '2 hours ago',
        read: false,
        type: 'success',
    },
    {
        id: '2',
        title: 'System Update',
        message: 'The system will be undergoing maintenance on Saturday at 2 AM.',
        date: '1 day ago',
        read: true,
        type: 'info',
    },
    {
        id: '3',
        title: 'Assessment Overdue',
        message: 'Assessment #AS-2023-004 is now overdue. Please review.',
        date: '3 days ago',
        read: true,
        type: 'alert',
    },
];

export function NotificationsScreen() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'alert': return 'alert-circle';
            default: return 'information-circle';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success': return '#059669';
            case 'alert': return '#dc2626';
            default: return '#3b82f6';
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[styles.item, !item.read && styles.unreadItem]}>
            <View style={styles.iconContainer}>
                <Ionicons name={getIcon(item.type)} size={24} color={getColor(item.type)} />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.itemHeader}>
                    <Text style={[styles.itemTitle, !item.read && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.itemDate}>{item.date}</Text>
                </View>
                <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.settingsContainer}>
                <Text style={styles.sectionHeader}>Settings</Text>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Push Notifications</Text>
                    <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: '#d1d5db', true: '#059669' }}
                    />
                </View>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Email Alerts</Text>
                    <Switch
                        value={emailEnabled}
                        onValueChange={setEmailEnabled}
                        trackColor={{ false: '#d1d5db', true: '#059669' }}
                    />
                </View>
            </View>

            <Text style={[styles.sectionHeader, styles.listHeader]}>Recent Activity</Text>

            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
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
    settingsContainer: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    listHeader: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    settingLabel: {
        fontSize: 16,
        color: '#1f2937',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    item: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadItem: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 3,
        borderLeftColor: '#059669',
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
    },
    unreadText: {
        color: '#059669',
    },
    itemDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    itemMessage: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#059669',
        marginLeft: 8,
        marginTop: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#9ca3af',
        fontSize: 16,
    },
});
