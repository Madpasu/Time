import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpzfybetxbfokcksvpbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwemZ5YmV0eGJmb2tja3N2cGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NTQ3NjIsImV4cCI6MjA0NTIzMDc2Mn0.U55wWdyJii4mJE3jRTZxfoVsS7zL0os8tO-GFHgpriw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => {
      return fetch(...args).catch(err => {
        console.error('Supabase fetch error:', err);
        throw err;
      });
    }
  },
  db: {
    schema: 'public'
  }
});

export interface TimeCapsule {
  id: string;
  created_at: string;
  type: 'text' | 'image' | 'video';
  content: string;
  media_path: string;
  expires_at: string;
  is_opened: boolean;
  available_at: string;
  name: string;
  remaining_duration: number | null;
  view_duration: number;
  first_opened_at: string | null;
}

export async function createTimeCapsule({
  type,
  content,
  media_path,
  name,
  available_at,
  view_duration,
}: {
  type: 'text' | 'image' | 'video';
  content: string;
  media_path: string;
  name: string;
  available_at: string;
  view_duration: number;
}) {
  try {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

    const { data, error } = await supabase
      .from('time_capsules')
      .insert([
        {
          type,
          content,
          media_path,
          expires_at: expiryDate.toISOString(),
          is_opened: false,
          name,
          available_at,
          view_duration,
          remaining_duration: view_duration,
          first_opened_at: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating time capsule:', error);
    throw error;
  }
}

export async function uploadMedia(file: File): Promise<string> {
  try {
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('stuff')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;
    if (!data?.path) throw new Error('Upload failed - no path returned');

    return data.path;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

export async function getTimeCapsule(id: string): Promise<TimeCapsule> {
  try {
    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Capsule not found');
    return data;
  } catch (error) {
    console.error('Error fetching time capsule:', error);
    throw error;
  }
}

export async function getMediaUrl(path: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('stuff')
      .createSignedUrl(path, 3600);

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to get signed URL');
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
}

export async function markCapsuleAsOpened(id: string) {
  try {
    const { data: capsule } = await supabase
      .from('time_capsules')
      .select('first_opened_at')
      .eq('id', id)
      .single();

    if (!capsule?.first_opened_at) {
      const { error } = await supabase
        .from('time_capsules')
        .update({ 
          is_opened: true,
          first_opened_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error marking capsule as opened:', error);
    throw error;
  }
}

export async function deleteMedia(path: string) {
  try {
    const { error } = await supabase.storage
      .from('stuff')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
}

export async function deleteCapsule(id: string) {
  try {
    const { data: capsule } = await supabase
      .from('time_capsules')
      .select('media_path')
      .eq('id', id)
      .single();

    if (capsule?.media_path) {
      await deleteMedia(capsule.media_path);
    }

    const { error } = await supabase
      .from('time_capsules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting capsule:', error);
    throw error;
  }
}

export async function cleanupExpiredCapsules() {
  try {
    const now = new Date().toISOString();
    
    // Get expired capsules
    const { data: expiredCapsules, error: fetchError } = await supabase
      .from('time_capsules')
      .select('id, media_path')
      .or(`expires_at.lt.${now},and(is_opened.eq.true,remaining_duration.eq.0)`);

    if (fetchError) throw fetchError;

    // Delete each expired capsule and its media
    for (const capsule of expiredCapsules || []) {
      if (capsule.media_path) {
        await deleteMedia(capsule.media_path);
      }
      await supabase
        .from('time_capsules')
        .delete()
        .eq('id', capsule.id);
    }
  } catch (error) {
    console.error('Error cleaning up expired capsules:', error);
    throw error;
  }
}

export async function getAllCapsules(): Promise<TimeCapsule[]> {
  try {
    const { data, error } = await supabase
      .from('time_capsules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching capsules:', error);
    throw error;
  }
}