import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { Announcement, User } from '../lib/types';
import { formatDistanceToNow, format } from 'date-fns';

interface Props {
  user: User;
  navigation: any;
}

export default function AnnouncementsScreen({ user, navigation }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    const data = await storage.getAnnouncements();
    setAnnouncements(data);
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }: { item: Announcement; index: number }) => {
    const timeAgo = (() => {
      try { return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }); }
      catch { return 'recently'; }
    })();
    const formattedDate = (() => {
      try { return format(new Date(item.createdAt), 'MMM d, yyyy'); }
      catch { return ''; }
    })();

    return (
      <View style={[styles.annCard, index === 0 && styles.annCardFirst]}>
        {index === 0 && (
          <View style={styles.latestBadge}>
            <Ionicons name="radio-outline" size={11} color={Colors.card} />
            <Text style={styles.latestBadgeText}>LATEST</Text>
          </View>
        )}
        <View style={styles.annHeader}>
          <View style={styles.annIconBox}>
            <Ionicons name="megaphone-outline" size={22} color={Colors.accent} />
          </View>
          <View style={styles.annMeta}>
            <Text style={styles.annDate}>{formattedDate}</Text>
            <Text style={styles.annTime}>{timeAgo}</Text>
          </View>
        </View>
        <Text style={styles.annTitle}>{item.title}</Text>
        <Text style={styles.annBody}>{item.body}</Text>
        <View style={styles.annFooter}>
          <Ionicons name="person-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.annAdmin}>{item.adminName}</Text>
          <Text style={styles.annAdminRole}>• Admin</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="megaphone-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No announcements</Text>
      <Text style={styles.emptyText}>Check back later for campus announcements</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Announcements</Text>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={item => item.id}
        renderItem={renderItem}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  list: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  annCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.md,
    position: 'relative',
    overflow: 'hidden',
  },
  annCardFirst: {
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  latestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: Radius.md,
  },
  latestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.card,
    letterSpacing: 0.5,
  },
  annHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  annIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annMeta: { gap: 2 },
  annDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  annTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  annTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  annBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  annFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  annAdmin: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  annAdminRole: {
    fontSize: 12,
    color: Colors.textMuted,
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
  },
});
