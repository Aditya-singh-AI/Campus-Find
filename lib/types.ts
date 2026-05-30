export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  studentId: string;
  avatar?: string;
  joinedAt: string;
}

export type ItemCategory =
  | 'Electronics'
  | 'Documents'
  | 'Clothing'
  | 'Accessories'
  | 'Books'
  | 'Keys'
  | 'Bags'
  | 'Sports'
  | 'Other';

export type ItemStatus = 'active' | 'claimed' | 'returned' | 'expired';
export type ItemType = 'lost' | 'found';
export type Priority = 'urgent' | 'normal';
export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface LostFoundItem {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  category: ItemCategory;
  date: string;
  time: string;
  location: string;
  images: string[];
  priority: Priority;
  status: ItemStatus;
  reportedBy: string;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
  matchScore?: number;
  matchedItemId?: string;
}

export interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  description: string;
  proofDescription: string;
  status: ClaimStatus;
  submittedAt: string;
  updatedAt: string;
  adminNote?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'match' | 'claim' | 'announcement' | 'update';
  read: boolean;
  createdAt: string;
  itemId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  adminName: string;
}
