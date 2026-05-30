import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Claim } from '../lib/types';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  claim: Claim;
  onPress?: () => void;
  showActions?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const statusConfig = {
  pending: { color: Colors.warning, bg: Colors.warningLight, icon: 'time-outline', label: 'Pending Review' },
  approved: { color: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle-outline', label: 'Approved' },
  rejected: { color: Colors.danger, bg: Colors.dangerLight, icon: 'close-circle-outline', label: 'Rejected' },
  resolved: { color: Colors.primary, bg: Colors.primaryLight, icon: 'ribbon-outline', label: 'Resolved' },
};

export default function ClaimCard({ claim, onPress, showActions, onApprove, onReject }: Props) {
  const status = statusConfig[claim.status];
  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(claim.submittedAt), { addSuffix: true }); }
    catch { return 'recently'; }
  })();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.itemTitle} numberOfLines={1}>{claim.itemTitle}</Text>
          <View style={[styles.typeBadge, { backgroundColor: claim.itemType === 'lost' ? Colors.lostLight : Colors.foundLight }]}>
            <Text style={[styles.typeText, { color: claim.itemType === 'lost' ? Colors.lost : Colors.found }]}>
              {claim.itemType.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={13} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.claimantName}>{claim.claimantName}</Text>
      <Text style={styles.description} numberOfLines={2}>{claim.description}</Text>

      {claim.adminNote && (
        <View style={styles.adminNote}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
          <Text style={styles.adminNoteText}>{claim.adminNote}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{timeAgo}</Text>
        </View>
      </View>

      {showActions && claim.status === 'pending' && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={onReject}
          >
            <Ionicons name="close" size={16} color={Colors.danger} />
            <Text style={[styles.actionText, { color: Colors.danger }]}>Reject</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={onApprove}
          >
            <Ionicons name="checkmark" size={16} color={Colors.card} />
            <Text style={[styles.actionText, { color: Colors.card }]}>Approve</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    ...Shadow.md,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  claimantName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  adminNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: Radius.sm,
  },
  adminNoteText: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  rejectBtn: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
