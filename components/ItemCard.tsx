import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LostFoundItem } from '../lib/types';
import { Colors, Spacing, Radius, Shadow, categoryColors, categoryIcons } from '../lib/theme';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  item: LostFoundItem;
  onPress: () => void;
  compact?: boolean;
}

export default function ItemCard({ item, onPress, compact }: Props) {
  const isLost = item.type === 'lost';
  const catColor = categoryColors[item.category] || categoryColors.Other;
  const catIcon = categoryIcons[item.category] || 'cube-outline';

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    } catch {
      return 'recently';
    }
  })();

  const statusConfig = {
    active: { color: Colors.success, label: 'Active' },
    claimed: { color: Colors.warning, label: 'Claimed' },
    returned: { color: Colors.primary, label: 'Returned' },
    expired: { color: Colors.textMuted, label: 'Expired' },
  }[item.status];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        compact && styles.cardCompact,
      ]}
      onPress={onPress}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: isLost ? Colors.lost : Colors.found }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={[styles.typeBadge, { backgroundColor: isLost ? Colors.lostLight : Colors.foundLight }]}>
            <Ionicons
              name={isLost ? 'search-outline' : 'checkmark-circle-outline'}
              size={11}
              color={isLost ? Colors.lost : Colors.found}
            />
            <Text style={[styles.typeBadgeText, { color: isLost ? Colors.lost : Colors.found }]}>
              {isLost ? 'LOST' : 'FOUND'}
            </Text>
          </View>

          {item.priority === 'urgent' && (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle" size={11} color={Colors.urgent} />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}

          <View style={styles.flex} />

          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

        {/* Description */}
        {!compact && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.categoryChip, { backgroundColor: catColor.bg }]}>
            <Ionicons name={catIcon as any} size={11} color={catColor.text} />
            <Text style={[styles.categoryText, { color: catColor.text }]}>{item.category}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{timeAgo}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.reporterName.split(' ')[0]}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.md,
  },
  cardCompact: {
    marginHorizontal: 0,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.urgentLight,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.urgent,
    letterSpacing: 0.5,
  },
  flex: { flex: 1 },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
