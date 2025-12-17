import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

export function Sidebar(props: DrawerContentComponentProps) {
    const { user, logout } = useAuth();
    const { navigation } = props;

    const navigateTo = (screen: string) => {
        navigation.navigate(screen);
    };

    return (
        <View style={styles.container}>
            {/* Drawer Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user?.name || 'User')}</Text>
                    </View>
                    <View>
                        <Text style={styles.name}>{user?.name || 'User'}</Text>
                        <Text style={styles.role}>{user?.role || 'Guest'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.menuContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Menu</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Dashboard')}>
                        <Ionicons name="grid-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Dashboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Assessments')}>
                        <Ionicons name="document-text-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Assessments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Payments')}>
                        <Ionicons name="wallet-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Payments</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Institutions')}>
                        <Ionicons name="business-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Institutions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('LGAList')}>
                        <Ionicons name="map-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>LGAs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Reports')}>
                        <Ionicons name="stats-chart-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Reports</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Profile')}>
                        <Ionicons name="person-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Notifications')}>
                        <Ionicons name="notifications-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Notifications</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('ChangePassword')}>
                        <Ionicons name="lock-closed-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Change Password</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('HelpSupport')}>
                        <Ionicons name="help-circle-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>Help & Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('About')}>
                        <Ionicons name="information-circle-outline" size={22} color="#4b5563" />
                        <Text style={styles.menuText}>About</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer / Logout */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <Text style={styles.version}>v1.0.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    role: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    menuContainer: {
        flex: 1,
        paddingVertical: 10,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    menuText: {
        marginLeft: 12,
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        justifyContent: 'center',
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: '600',
        color: '#dc2626',
    },
    version: {
        textAlign: 'center',
        marginTop: 12,
        fontSize: 11,
        color: '#d1d5db',
    },
});
