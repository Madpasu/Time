import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, List, Trash2, Timer, FileText, Image, Video, Lock, Unlock } from 'lucide-react';
import { TimeCapsule, deleteCapsule } from '../lib/supabase';
import { Toast } from './ui/Toast';
import { CalendarView } from './CalendarView';

interface CapsuleListProps {
  capsules: TimeCapsule[];
  loading: boolean;
  onDelete: () => void;
}

export function CapsuleList({ capsules, loading, onDelete }: CapsuleListProps) {
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [toast, setToast] = useState<string | null>(null);
  const [remainingTimes, setRemainingTimes] = useState<Record<string, number>>({});

  // Refresh when returning to homepage
  useEffect(() => {
    if (location.pathname === '/') {
      onDelete(); // Trigger refresh of capsules
    }
  }, [location.pathname, onDelete]);

  const isAvailable = (capsule: TimeCapsule) => {
    const now = new Date().getTime();
    const availableTime = new Date(capsule.available_at).getTime();
    return now >= availableTime;
  };

  const isPartiallyViewed = (capsule: TimeCapsule) => {
    return capsule.is_opened && capsule.first_opened_at !== null;
  };

  const calculateRemainingTime = (capsule: TimeCapsule): number => {
    if (!capsule.first_opened_at) return capsule.view_duration;
    
    const firstOpenedTime = new Date(capsule.first_opened_at).getTime();
    const now = Date.now();
    const elapsedSeconds = (now - firstOpenedTime) / 1000;
    return Math.max(0, capsule.view_duration - elapsedSeconds);
  };

  const getRemainingTimeColor = (remainingTime: number, totalDuration: number) => {
    const percentage = (remainingTime / totalDuration) * 100;
    
    if (percentage > 66) return 'text-green-400';
    if (percentage > 33) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBackgroundColor = (remainingTime: number, totalDuration: number) => {
    const percentage = (remainingTime / totalDuration) * 100;
    
    if (percentage > 66) return 'bg-green-600/20';
    if (percentage > 33) return 'bg-yellow-600/20';
    return 'bg-red-600/20';
  };

  const formatTimeUntilAvailable = (availableAt: string) => {
    const now = new Date().getTime();
    const availableTime = new Date(availableAt).getTime();
    const diffInSeconds = (availableTime - now) / 1000;
    
    if (diffInSeconds <= 60) {
      return `${Math.ceil(diffInSeconds)}s`;
    }
    
    const days = Math.floor(diffInSeconds / (24 * 60 * 60));
    const remainingSeconds = diffInSeconds % (24 * 60 * 60);
    const minutes = Math.ceil(remainingSeconds / 60);
    
    if (days > 0) {
      return `${days}d ${minutes}m`;
    }
    
    return `${minutes}m`;
  };

  useEffect(() => {
    // Initialize remaining times for all capsules
    const times: Record<string, number> = {};
    capsules.forEach(capsule => {
      if (isPartiallyViewed(capsule)) {
        times[capsule.id] = calculateRemainingTime(capsule);
      }
    });
    setRemainingTimes(times);

    // Update timer every second
    const interval = setInterval(() => {
      setRemainingTimes(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          const capsule = capsules.find(c => c.id === id);
          if (capsule && isPartiallyViewed(capsule)) {
            updated[id] = calculateRemainingTime(capsule);
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [capsules]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.ceil(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.ceil(seconds % 60);
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const TypeIcon = ({ type }: { type: TimeCapsule['type'] }) => {
    switch (type) {
      case 'text':
        return <FileText className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
    }
  };

  const StatusIcon = ({ capsule }: { capsule: TimeCapsule }) => {
    const available = isAvailable(capsule);
    const partiallyViewed = isPartiallyViewed(capsule);

    if (partiallyViewed) {
      return <Timer className="w-4 h-4" />;
    }
    if (available) {
      return <Unlock className="w-4 h-4" />;
    }
    return <Lock className="w-4 h-4" />;
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this time capsule?')) {
      return;
    }

    try {
      await deleteCapsule(id);
      onDelete();
      setToast('Time capsule deleted successfully');
    } catch (err) {
      console.error('Error deleting capsule:', err);
      setToast('Failed to delete time capsule');
    }
  };

  const handleUnavailableClick = (e: React.MouseEvent, capsule: TimeCapsule) => {
    e.preventDefault();
    const availableDate = new Date(capsule.available_at);
    setToast(`This capsule will be available on ${availableDate.toLocaleDateString()} at ${availableDate.toLocaleTimeString()}`);
  };

  const renderCapsuleList = (capsules: TimeCapsule[], title: string) => {
    if (capsules.length === 0) return null;

    return (
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <div className="space-y-4">
          {capsules.map(capsule => {
            const available = isAvailable(capsule);
            const partiallyViewed = isPartiallyViewed(capsule);
            const remainingTime = partiallyViewed ? remainingTimes[capsule.id] : capsule.view_duration;
            const timeColor = partiallyViewed ? getRemainingTimeColor(remainingTime, capsule.view_duration) : 'text-green-400';
            const bgColor = partiallyViewed ? getStatusBackgroundColor(remainingTime, capsule.view_duration) : 'bg-white/5';
            
            return (
              <Link
                key={capsule.id}
                to={available ? `/view/${capsule.id}` : '#'}
                onClick={(e) => !available && handleUnavailableClick(e, capsule)}
                className={`block bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors relative group ${
                  !available ? 'cursor-not-allowed opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${bgColor}`}>
                      <TypeIcon type={capsule.type} />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">
                        {capsule.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`flex items-center gap-2 ${
                          partiallyViewed ? timeColor : available ? 'text-green-400' : 'text-white/70'
                        }`}>
                          <StatusIcon capsule={capsule} />
                          {available ? (
                            partiallyViewed ? (
                              <span>{formatDuration(remainingTime)} remaining</span>
                            ) : (
                              <span>Available to view • {formatDuration(remainingTime)}</span>
                            )
                          ) : (
                            <span>Available in {formatTimeUntilAvailable(capsule.available_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, capsule.id)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete capsule"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const unopenedCapsules = capsules.filter(c => !isPartiallyViewed(c));
  const openedCapsules = capsules.filter(c => isPartiallyViewed(c) && remainingTimes[c.id] > 0);

  if (loading) {
    return (
      <div className="text-center text-white/70 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading time capsules...</p>
      </div>
    );
  }

  if (capsules.length === 0) {
    return (
      <div className="text-center text-white/70 py-8">
        <p>No time capsules found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Time Capsules</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'calendar'
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-8">
          {renderCapsuleList(unopenedCapsules, "Upcoming Capsules")}
          {renderCapsuleList(openedCapsules, "Expiring Capsules")}
        </div>
      ) : (
        <CalendarView
          capsules={capsules.filter(c => !isPartiallyViewed(c) || remainingTimes[c.id] > 0)}
          onCapsuleClick={(capsule) => {
            if (!isAvailable(capsule)) {
              handleUnavailableClick(new MouseEvent('click'), capsule);
            }
          }}
          onDelete={handleDelete}
        />
      )}
      
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}