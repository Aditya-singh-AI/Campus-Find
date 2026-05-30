import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { LostFoundItem, Notification, Announcement, User } from '../lib/types';
import ItemCard from '../components/ItemCard';
import StatsCard from '../components/StatsCard';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  user: User;
  navigation: any;
}

export default function HomeScreen({ user, navigation }: Props) {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');

  const loadData = useCallback(async () => {
    const [itemsData, notifsData, annsData] = await Promise.all([
      storage.getItems(),
      storage.getNotifications(),
      storage.getAnnouncements(),
    ]);
    setItems(itemsData);
    setNotifications(notifsData.filter(n => n.userId === user.id));
    setAnnouncements(annsData);
  }, [user.id]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [loadData, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return item.status === 'active';
    return item.type === filter && item.status === 'active';
  }).slice(0, 20);

  const unreadCount = notifications.filter(n => !n.read).length;
  const lostCount = items.filter(i => i.type === 'lost' && i.status === 'active').length;
  const foundCount = items.filter(i => i.type === 'found' && i.status === 'active').length;
  const resolvedCount = items.filter(i => i.status === 'returned').length;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user.name.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>{user.department} • {user.role}</Text>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatsCard
          label="Lost Items"
          value={lostCount}
          icon="search-outline"
          color={Colors.lost}
          bgColor={Colors.lostLight}
        />
        <StatsCard
          label="Found Items"
          value={foundCount}
          icon="checkmark-circle-outline"
          color={Colors.found}
          bgColor={Colors.foundLight}
        />
        <StatsCard
          label="Resolved"
          value={resolvedCount}
          icon="ribbon-outline"
          color={Colors.primary}
          bgColor={Colors.primaryLight}
        />
      </View>

      {/* Announcement Banner */}
      {announcements.length > 0 && (
        <Pressable
          style={styles.announcementBanner}
          onPress={() => navigation.navigate('Announcements')}
        >
          <View style={styles.announcementLeft}>
            <Ionicons name="megaphone-outline" size={20} color={Colors.accent} />
          </View>
          <View style={styles.announcementContent}>
            <Text style={styles.announcementTitle} numberOfLines={1}>
              {announcements[0].title}
            </Text>
            <Text style={styles.announcementBody} numberOfLines={1}>
              {announcements[0].body}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.lostLight }]}
          onPress={() => navigation.navigate('Report', { type: 'lost' })}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.lost }]}>
            <Ionicons name="search-outline" size={20} color={Colors.card} />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.lost }]}>Report Lost</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.foundLight }]}
          onPress={() => navigation.navigate('Report', { type: 'found' })}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.found }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.card} />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.found }]}>Report Found</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.primaryLight }]}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary }]}>
            <Ionicons name="filter-outline" size={20} color={Colors.card} />
          </View>
          <Text style={[styles.quickActionText, { color: Colors.primary }]}>Browse</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        <View style={styles.filterRow}>
          {(['all', 'lost', 'found'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No items found</Text>
      <Text style={styles.emptyText}>Be the first to report a lost or found item</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredItems}
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
  list: { paddingBottom: Spacing.xl },
  headerContainer: { gap: Spacing.md, paddingBottom: Spacing.sm },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.card,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  announcementLeft: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementContent: { flex: 1 },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  announcementBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.card,
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
