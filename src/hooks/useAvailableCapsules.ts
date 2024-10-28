import { useState, useEffect, useCallback } from 'react';
import { supabase, TimeCapsule, cleanupExpiredCapsules } from '../lib/supabase';

const RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRIES = 3;

export function useAvailableCapsules() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchCapsules = useCallback(async () => {
    try {
      // First, cleanup expired capsules
      await cleanupExpiredCapsules().catch(console.error);

      const now = new Date().toISOString();
      
      // Get capsules that are either:
      // 1. Not opened yet and not expired
      // 2. Opened but still have remaining time
      const { data, error } = await supabase
        .from('time_capsules')
        .select('*')
        .or(`is_opened.eq.false,and(is_opened.eq.true,remaining_duration.gt.0)`)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCapsules(data || []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching capsules:', err);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCapsules();
        }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchCapsules();
    
    // Check for expired capsules every minute
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupExpiredCapsules();
        fetchCapsules(); // Refresh the list after cleanup
      } catch (error) {
        console.error('Cleanup interval error:', error);
      }
    }, 60000);

    // Real-time subscription
    const channel = supabase
      .channel('time_capsules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_capsules'
        },
        async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
          fetchCapsules();
        }
      )
      .subscribe();

    return () => {
      clearInterval(cleanupInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchCapsules]);

  return { capsules, loading, refetch: fetchCapsules };
}