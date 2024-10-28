import React from 'react';
import { TimeCapsule } from '../../types/timeCapsule';
import { supabase } from '../../config/supabase';

interface CapsuleContentProps {
  capsule: TimeCapsule;
}

export const CapsuleContent: React.FC<CapsuleContentProps> = ({ capsule }) => {
  const getMediaUrl = (path: string) => {
    return supabase.storage
      .from('stuff')
      .getPublicUrl(path, {
        transform: {
          width: 1200,
          quality: 80
        }
      }).data.publicUrl;
  };

  if (capsule.type === 'text') {
    return (
      <div className="bg-white/5 p-6 rounded-lg">
        <p className="text-white whitespace-pre-wrap">{capsule.content}</p>
      </div>
    );
  }

  if (capsule.type === 'image') {
    return (
      <img
        src={getMediaUrl(capsule.content)}
        alt="Time Capsule Content"
        className="w-full h-auto rounded-lg"
        loading="eager"
      />
    );
  }

  if (capsule.type === 'video') {
    return (
      <video
        src={getMediaUrl(capsule.content)}
        controls
        autoPlay
        className="w-full h-auto rounded-lg"
        preload="auto"
      />
    );
  }

  return null;
};