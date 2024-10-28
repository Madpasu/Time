import { supabase } from '../config/supabase';

export const initializeStorage = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'stuff');

    if (!bucketExists) {
      console.error('Storage bucket stuff not found');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
};

// Initialize storage
initializeStorage();