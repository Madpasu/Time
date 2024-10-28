export interface TimeCapsule {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  created_at: string;
  expires_at: string;
  viewed_at: string | null;
}

export type TimeCapsuleInsert = Omit<TimeCapsule, 'id'>;