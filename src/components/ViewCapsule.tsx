import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, AlertCircle, Play, ArrowLeft } from 'lucide-react';
import { getTimeCapsule, getMediaUrl, markCapsuleAsOpened, deleteCapsule, TimeCapsule } from '../lib/supabase';

export function ViewCapsule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState<TimeCapsule | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const formatRemainingTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.max(0, Math.floor(seconds))} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
  };

  const calculateTimeLeft = (capsule: TimeCapsule): number => {
    if (!capsule.first_opened_at) return capsule.view_duration;
    
    const firstOpenedTime = new Date(capsule.first_opened_at).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - firstOpenedTime) / 1000;
    const remainingSeconds = capsule.view_duration - elapsedSeconds;
    
    return Math.max(0, remainingSeconds);
  };

  useEffect(() => {
    const loadCapsule = async () => {
      if (!id) return;
      
      try {
        const capsuleData = await getTimeCapsule(id);
        
        const availableTime = new Date(capsuleData.available_at).getTime();
        const now = new Date().getTime();
        if (now < availableTime) {
          setError('This time capsule is not yet available for viewing.');
          return;
        }

        const expiryDate = new Date(capsuleData.expires_at);
        if (expiryDate < new Date()) {
          setError('This time capsule has expired.');
          await deleteCapsule(id);
          return;
        }

        setCapsule(capsuleData);
        
        // If the capsule was previously opened, set started to true
        if (capsuleData.first_opened_at) {
          setStarted(true);
        }

        const remaining = calculateTimeLeft(capsuleData);
        setTimeLeft(remaining);

        // If the capsule has expired based on view duration, delete it and redirect
        if (remaining <= 0) {
          await deleteCapsule(id);
          navigate('/');
          return;
        }

        if (capsuleData.media_path) {
          try {
            const url = await getMediaUrl(capsuleData.media_path);
            setMediaUrl(url);
          } catch (mediaError) {
            console.error('Failed to load media:', mediaError);
            setMediaError(true);
          }
        }
        
      } catch (err) {
        console.error('Failed to load time capsule:', err);
        setError('Failed to load time capsule');
      } finally {
        setLoading(false);
      }
    };

    loadCapsule();
  }, [id, navigate]);

  // Handle starting the capsule view
  const handleStart = async () => {
    if (!capsule || !id || capsule.first_opened_at) return;
    
    try {
      await markCapsuleAsOpened(id);
      
      // Update capsule with first_opened_at time
      setCapsule(prev => prev ? {
        ...prev,
        first_opened_at: new Date().toISOString(),
        is_opened: true
      } : null);
      
      setStarted(true);
    } catch (err) {
      console.error('Failed to start capsule view:', err);
      setError('Failed to start viewing. Please try again.');
    }
  };

  // Effect for handling the countdown and auto-redirect
  useEffect(() => {
    if (!started || !capsule) return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(capsule);
      setTimeLeft(remaining);

      // Auto-redirect when time expires
      if (remaining <= 0) {
        clearInterval(timer);
        deleteCapsule(id!).then(() => {
          navigate('/');
        });
      }
    }, 100); // Update frequently for smooth countdown

    return () => clearInterval(timer);
  }, [started, capsule, id, navigate]);

  const handleMediaError = () => {
    setMediaError(true);
    setMediaLoaded(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || mediaError) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <div className="text-red-500 mb-4">
            {error || 'Failed to load media content. Please try again later.'}
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Capsules
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Capsules
        </button>

        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <Timer className="w-16 h-16 text-purple-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Ready to {capsule?.first_opened_at ? 'continue viewing' : 'open'} this time capsule?
          </h2>
          <p className="text-gray-600 mb-6">
            {capsule?.first_opened_at 
              ? `You have ${formatRemainingTime(timeLeft)} remaining to view this capsule.`
              : `Once opened, you'll have ${formatRemainingTime(timeLeft)} to view its contents before it disappears forever.`}
          </p>
          <button
            onClick={handleStart}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            {capsule?.first_opened_at ? 'Continue Viewing' : 'Open Capsule'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Capsules
        </button>
        <div className="flex items-center gap-2 text-purple-600">
          <Timer className="animate-pulse" />
          <span className="font-bold text-xl">{formatRemainingTime(timeLeft)} remaining</span>
        </div>
      </div>

      <div className="space-y-6">
        {capsule?.type === 'text' && (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-lg text-center whitespace-pre-wrap">
              {capsule.content}
            </p>
          </div>
        )}

        {capsule?.type === 'image' && mediaUrl && (
          <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${!mediaLoaded ? 'min-h-[300px]' : ''}`}>
            {!mediaLoaded && !mediaError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            )}
            <img
              src={mediaUrl}
              alt="Time Capsule Content"
              className={`w-full h-auto rounded-lg ${!mediaLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              onLoad={() => setMediaLoaded(true)}
              onError={handleMediaError}
            />
          </div>
        )}

        {capsule?.type === 'video' && mediaUrl && (
          <div className="rounded-lg overflow-hidden bg-gray-100">
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="w-full h-auto"
              onError={handleMediaError}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    </div>
  );
}