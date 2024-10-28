import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpzfybetxbfokcksvpbe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwemZ5YmV0eGJmb2tja3N2cGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NTQ3NjIsImV4cCI6MjA0NTIzMDc2Mn0.U55wWdyJii4mJE3jRTZxfoVsS7zL0os8tO-GFHgpriw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket name
export const STORAGE_BUCKET = 'timecapsules';

// Helper function to handle media uploads
export async function uploadMedia(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;
  if (!data?.path) throw new Error('Upload failed');

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}

// Helper function to create a time capsule
export async function createTimeCapsule(type: string, content: string) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data, error } = await supabase
    .from('time_capsules')
    .insert([
      {
        type,
        content,
        expires_at: expiresAt.toISOString(),
        viewed_at: null,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper function to delete expired capsules
export async function deleteExpiredCapsule(id: string) {
  // First, get the capsule to check if it has media
  const { data: capsule } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('id', id)
    .single();

  if (capsule && (capsule.type === 'image' || capsule.type === 'video')) {
    // Extract filename from the URL
    const urlParts = capsule.content.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Delete the file from storage
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`public/${filename}`]);
  }

  // Delete the database record
  const { error } = await supabase
    .from('time_capsules')
    .delete()
    .match({ id });

  if (error) throw error;
}

// Helper function to mark capsule as viewed
export async function markCapsuleAsViewed(id: string) {
  const { error } = await supabase
    .from('time_capsules')
    .update({ viewed_at: new Date().toISOString() })
    .match({ id });

  if (error) throw error;
}