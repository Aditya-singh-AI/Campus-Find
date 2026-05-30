import { supabase } from './supabase';
import { LostFoundItem, Claim, Notification, User, Announcement } from './types';

export const storage = {
  async getUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    // Fetch profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle(); // Use maybeSingle to prevent PGRST116 (0 rows) error
      
    if (error) {
      console.error('Error fetching profile:', error);
    }
    
    if (error || !data) {
      // Create and persist fallback profile if record not found
      // This is absolutely critical because the claims table has a foreign key referencing profiles(id)
      const fallbackUser: User = {
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'student',
        department: session.user.user_metadata?.department || 'General',
        studentId: session.user.user_metadata?.studentId || ('STU' + Date.now()),
        joinedAt: new Date().toISOString().split('T')[0],
      };
      
      await supabase.from('profiles').upsert(fallbackUser);
      return fallbackUser;
    }
    return data as User;
  },

  async setUser(user: User | null): Promise<void> {
    if (!user) return;
    await supabase.from('profiles').upsert(user);
  },

  async getItems(): Promise<LostFoundItem[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }
    return data || [];
  },

  async setItems(items: LostFoundItem[]): Promise<void> {
    // Deprecated for production database
  },

  async addItem(item: Omit<LostFoundItem, 'id'>): Promise<void> {
    const { error } = await supabase.from('items').insert([item as any]);
    if (error) console.error('Error adding item:', error);
  },

  async updateItem(id: string, updates: Partial<LostFoundItem>): Promise<void> {
    const { data, error } = await supabase.from('items').update(updates).eq('id', id).select();
    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.error('Update failed: No rows updated. Check RLS policies or item ID.');
      throw new Error('Update failed. You might not have permission, or the item does not exist.');
    }
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) console.error('Error deleting item:', error);
  },

  async getClaims(): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('submittedAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching claims:', error.message);
      if (typeof window !== 'undefined') {
        window.alert('Error fetching claims: ' + error.message);
      }
      return [];
    }
    return data || [];
  },

  async setClaims(claims: Claim[]): Promise<void> {
    // Deprecated for production database
  },

  async addClaim(claim: Omit<Claim, 'id'>): Promise<void> {
    const { error } = await supabase.from('claims').insert([claim as any]);
    if (error) {
      console.error('Error adding claim:', error);
      throw error;
    }
  },

  async updateClaim(id: string, updates: Partial<Claim>): Promise<void> {
    const { data, error } = await supabase.from('claims').update(updates).eq('id', id).select();
    if (error) {
      console.error('Error updating claim:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      console.error('Update failed: No rows updated. Check RLS policies or claim ID.');
      throw new Error('Update failed. You might not have permission, or the claim does not exist.');
    }
  },

  async getNotifications(): Promise<Notification[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return data || [];
  },

  async markNotificationRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('createdAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
    return data || [];
  },

  async addAnnouncement(ann: Omit<Announcement, 'id'>): Promise<void> {
    const { error } = await supabase.from('announcements').insert([ann as any]);
    if (error) console.error('Error adding announcement:', error);
  },

  async clearAll(): Promise<void> {
    await supabase.auth.signOut();
  },
};
