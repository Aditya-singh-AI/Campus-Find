import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow, categoryIcons } from '../lib/theme';
import { storage } from '../lib/store';
import { LostFoundItem, ItemCategory, ItemType } from '../lib/types';
import ItemCard from '../components/ItemCard';
import { User } from '../lib/types';

const CATEGORIES: ItemCategory[] = [
  'Electronics', 'Documents', 'Clothing', 'Accessories',
  'Books', 'Keys', 'Bags', 'Sports', 'Other',
];

interface Props {
  user: User;
  navigation: any;
}

export default function SearchScreen({ user, navigation }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filtered, setFiltered] = useState<LostFoundItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'claimed' | 'returned'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadItems = useCallback(async () => {
    const data = await storage.getItems();
    setItems(data);
  }, []);

  useEffect(() => {
    loadItems();
    const unsubscribe = navigation.addListener('focus', loadItems);
    return unsubscribe;
  }, [loadItems, navigation]);

  useEffect(() => {
    let result = items;
    if (typeFilter !== 'all') result = result.filter(i => i.type === typeFilter);
    if (categoryFilter !== 'all') result = result.filter(i => i.category === categoryFilter);
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [items, query, typeFilter, categoryFilter, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const activeFiltersCount = [
    typeFilter !== 'all',
    categoryFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items, locations..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={showFilters ? Colors.card : Colors.text}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterSectionTitle}>Type</Text>
          <View style={styles.chipRow}>
            {(['all', 'lost', 'found'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.chip,
                  typeFilter === t && styles.chipActive,
                  t === 'lost' && typeFilter === t && { backgroundColor: Colors.lost },
                  t === 'found' && typeFilter === t && { backgroundColor: Colors.found },
                ]}
                onPress={() => setTypeFilter(t)}
              >
                <Text style={[styles.chipText, typeFilter === t && styles.chipTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Status</Text>
          <View style={styles.chipRow}>
            {(['all', 'active', 'claimed', 'returned'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, statusFilter === s && styles.chipActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Category</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, categoryFilter === 'all' && styles.chipActive]}
              onPress={() => setCategoryFilter('all')}
            >
              <Text style={[styles.chipText, categoryFilter === 'all' && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, categoryFilter === cat && styles.chipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Ionicons
                  name={categoryIcons[cat] as any}
                  size={12}
                  color={categoryFilter === cat ? Colors.card : Colors.textSecondary}
                />
                <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeFiltersCount > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={Colors.danger} />
              <Text style={styles.clearBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
        </Text>
        {query.length > 0 && (
          <Text style={styles.queryText}>for "{query}"</Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Search & Browse</Text>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { item })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  list: { paddingBottom: Spacing.xl },
  headerContainer: { gap: Spacing.md, paddingBottom: Spacing.sm },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.card,
  },
  filterPanel: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 10,
    ...Shadow.md,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.card,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.dangerLight,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  queryText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
