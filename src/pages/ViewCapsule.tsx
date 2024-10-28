import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTimeCapsule, getMediaUrl, markCapsuleAsOpened, deleteCapsule, deleteMedia, TimeCapsule } from '../lib/supabase';

export default function ViewCapsule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadCapsule = async () => {
      try {
        const data = await getTimeCapsule(id);
        setCapsule(data);

        if (data.media_path) {
          const url = await getMediaUrl(data.media_path);
          setMediaUrl(url);
        }

        await markCapsuleAsOpened(id);
        setLoading(false);

        // Start countdown
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              handleDelete();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        console.error('Failed to load time capsule:', err);
        setError('Failed to load time capsule');
        setLoading(false);
      }
    };

    loadCapsule();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !capsule) return;

    try {
      if (capsule.media_path) {
        await deleteMedia(capsule.media_path);
      }
      await deleteCapsule(id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete capsule:', err);
      setError('Failed to delete capsule');
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 text-center">
        <p>Loading time capsule...</p>
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 text-center">
        <p className="text-red-500">{error || 'Time capsule not found'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-purple-600">{timeLeft}</div>
        <p className="text-sm text-gray-500">seconds remaining</p>
      </div>

      <div className="space-y-4">
        {capsule.type === 'text' ? (
          <p className="text-gray-700 whitespace-pre-wrap">{capsule.content}</p>
        ) : capsule.type === 'image' ? (
          <img src={mediaUrl} alt="Time Capsule" className="w-full rounded-lg" />
        ) : (
          <video
            src={mediaUrl}
            controls
            className="w-full rounded-lg"
            autoPlay
            muted
          />
        )}
      </div>
    </div>
  );
}