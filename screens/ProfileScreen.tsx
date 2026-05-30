import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { User, LostFoundItem, Claim } from '../lib/types';
import ItemCard from '../components/ItemCard';

interface Props {
  user: User;
  navigation: any;
  onLogout: () => void;
}

export default function ProfileScreen({ user, navigation, onLogout }: Props) {
  const [myItems, setMyItems] = useState<LostFoundItem[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'claims'>('items');

  const loadData = useCallback(async () => {
    const [items, claims] = await Promise.all([
      storage.getItems(),
      storage.getClaims(),
    ]);
    setMyItems(items.filter(i => i.reportedBy === user.id));
    setMyClaims(claims.filter(c => c.claimantId === user.id));
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

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        storage.setUser(null).then(() => onLogout());
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              await storage.setUser(null);
              onLogout();
            },
          },
        ]
      );
    }
  };

  const roleColor = user.role === 'admin' ? Colors.secondary : user.role === 'staff' ? Colors.accent : Colors.primary;
  const roleBg = user.role === 'admin' ? Colors.secondaryLight : user.role === 'staff' ? Colors.accentLight : Colors.primaryLight;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: roleColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
              <Ionicons
                name={user.role === 'admin' ? 'shield-checkmark' : user.role === 'staff' ? 'briefcase' : 'school'}
                size={12}
                color={roleColor}
              />
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.profileMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="school-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{user.department}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="card-outline" size={13} color={Colors.textMuted} />
                <Text style={styles.metaText}>{user.studentId}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myItems.filter(i => i.type === 'lost').length}</Text>
            <Text style={styles.statLabel}>Lost Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myItems.filter(i => i.type === 'found').length}</Text>
            <Text style={styles.statLabel}>Found Reports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myClaims.filter(c => c.status === 'resolved').length}</Text>
            <Text style={styles.statLabel}>Recovered</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Report', { type: 'lost' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.lostLight }]}>
                <Ionicons name="search-outline" size={22} color={Colors.lost} />
              </View>
              <Text style={styles.actionLabel}>Report Lost</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Report', { type: 'found' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.foundLight }]}>
                <Ionicons name="checkmark-circle-outline" size={22} color={Colors.found} />
              </View>
              <Text style={styles.actionLabel}>Report Found</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accentLight }]}>
                <Ionicons name="notifications-outline" size={22} color={Colors.accent} />
              </View>
              <Text style={styles.actionLabel}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Announcements')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="megaphone-outline" size={22} color={Colors.info} />
              </View>
              <Text style={styles.actionLabel}>Announcements</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Activity Tabs */}
        <View style={styles.section}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.activityTab, activeTab === 'items' && styles.activityTabActive]}
              onPress={() => setActiveTab('items')}
            >
              <Text style={[styles.activityTabText, activeTab === 'items' && styles.activityTabTextActive]}>
                My Reports ({myItems.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.activityTab, activeTab === 'claims' && styles.activityTabActive]}
              onPress={() => setActiveTab('claims')}
            >
              <Text style={[styles.activityTabText, activeTab === 'claims' && styles.activityTabTextActive]}>
                My Claims ({myClaims.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'items' ? (
            myItems.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyActivityText}>No reports yet</Text>
              </View>
            ) : (
              myItems.slice(0, 5).map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  compact
                  onPress={() => navigation.navigate('ItemDetail', { item })}
                />
              ))
            )
          ) : (
            myClaims.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyActivityText}>No claims yet</Text>
              </View>
            ) : (
              myClaims.slice(0, 5).map(claim => (
                <View key={claim.id} style={styles.claimRow}>
                  <View style={styles.claimInfo}>
                    <Text style={styles.claimTitle} numberOfLines={1}>{claim.itemTitle}</Text>
                    <Text style={styles.claimStatus}>{claim.status}</Text>
                  </View>
                  <View style={[
                    styles.claimStatusBadge,
                    {
                      backgroundColor:
                        claim.status === 'approved' ? Colors.successLight :
                          claim.status === 'pending' ? Colors.warningLight :
                            claim.status === 'resolved' ? Colors.primaryLight :
                              Colors.dangerLight
                    }
                  ]}>
                    <Text style={[
                      styles.claimStatusText,
                      {
                        color:
                          claim.status === 'approved' ? Colors.success :
                            claim.status === 'pending' ? Colors.warning :
                              claim.status === 'resolved' ? Colors.primary :
                                Colors.danger
                      }
                    ]}>{claim.status}</Text>
                  </View>
                </View>
              ))
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.card,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  profileMeta: { gap: 4, marginTop: 4 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadow.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    padding: 4,
  },
  activityTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  activityTabActive: {
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  activityTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activityTabTextActive: { color: Colors.text },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyActivityText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  claimInfo: { flex: 1 },
  claimTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  claimStatus: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  claimStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  claimStatusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
