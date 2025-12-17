import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
interface LGA {
    id: number;
    name: string;
    code: string;
    state: string;
}

export function LGAScreen() {
    const [lgas, setLgas] = useState<LGA[]>([]);
    const [filteredLgas, setFilteredLgas] = useState<LGA[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadLgas = useCallback(async () => {
        try {
            const res = await api.getLGAs();
            setLgas(res.items || []);
            setFilteredLgas(res.items || []);
        } catch (error) {
            console.error('Failed to load LGAs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadLgas();
    }, [loadLgas]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = lgas.filter((lga) =>
                lga.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredLgas(filtered);
        } else {
            setFilteredLgas(lgas);
        }
    }, [searchQuery, lgas]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadLgas();
    }, [loadLgas]);

    const renderItem = ({ item, index }: { item: LGA; index: number }) => (
        <View style={styles.itemCard}>
            <View style={styles.iconContainer}>
                <Ionicons name="map-outline" size={20} color="#059669" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.lgaName}>{item.name}</Text>
                <Text style={styles.lgaCode}>{item.code}</Text>
            </View>
            <View style={styles.stateContainer}>
                <Text style={styles.stateText}>{item.state}</Text>
            </View>
        </View>
    );

    if (loading && lgas.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search LGAs..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9ca3af"
                />
            </View>

            <FlatList
                data={filteredLgas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No LGAs found</Text>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    rankContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    contentContainer: {
        flex: 1,
    },
    lgaName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    transactionCount: {
        fontSize: 12,
        color: '#6b7280',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: 16,
    },
});
