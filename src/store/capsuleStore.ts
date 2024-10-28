import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CapsuleStore {
  isLoading: boolean;
  currentCapsule: any;
  setLoading: (loading: boolean) => void;
  uploadCapsule: (file: File | string, type: string) => Promise<string>;
  getCapsule: (id: string) => Promise<any>;
  deleteCapsule: (id: string) => Promise<void>;
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  isLoading: false,
  currentCapsule: null,
  setLoading: (loading) => set({ isLoading: loading }),
  
  uploadCapsule: async (file, type) => {
    set({ isLoading: true });
    try {
      let capsuleData: any = {
        type,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        viewed: false
      };

      if (type === 'text') {
        capsuleData.content = file;
      } else {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const { data, error } = await supabase.storage
          .from('capsules')
          .upload(filename, file);
          
        if (error) throw error;
        capsuleData.content = data.path;
      }

      const { data, error } = await supabase
        .from('capsules')
        .insert(capsuleData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } finally {
      set({ isLoading: false });
    }
  },

  getCapsule: async (id) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('capsules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Capsule not found');

      if (new Date(data.expires_at) < new Date()) {
        await get().deleteCapsule(id);
        throw new Error('Capsule has expired');
      }

      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCapsule: async (id) => {
    const { data } = await supabase
      .from('capsules')
      .select('content, type')
      .eq('id', id)
      .single();

    if (data && data.type !== 'text') {
      await supabase.storage
        .from('capsules')
        .remove([data.content]);
    }

    await supabase
      .from('capsules')
      .delete()
      .eq('id', id);
  }
}));