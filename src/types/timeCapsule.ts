export type CapsuleType = 'text' | 'image' | 'video';

export interface TimeCapsule {
  id: string;
  content: string;
  type: CapsuleType;
  expires_at: string;
  viewed_at: string | null;
  created_at: string;
}