import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Image, Video, Lock, Unlock, Trash2, Eye } from 'lucide-react';
import { TimeCapsule } from '../lib/supabase';

interface CalendarViewProps {
  capsules: TimeCapsule[];
  onCapsuleClick: (capsule: TimeCapsule) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

const TypeIcon = ({ type }: { type: TimeCapsule['type'] }) => {
  switch (type) {
    case 'text':
      return <FileText className="w-4 h-4" />;
    case 'image':
      return <Image className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
  }
};

export function CalendarView({ capsules, onCapsuleClick, onDelete }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredCapsule, setHoveredCapsule] = useState<string | null>(null);

  const isAvailable = (capsule: TimeCapsule) => {
    const now = new Date().getTime();
    const availableTime = new Date(capsule.available_at).getTime();
    return now >= availableTime;
  };

  const isPartiallyViewed = (capsule: TimeCapsule) => {
    return capsule.is_opened && capsule.remaining_duration && capsule.remaining_duration > 0;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getCapsulesByDate = (date: Date) => {
    return capsules.filter(capsule => {
      const capsuleDate = new Date(capsule.available_at);
      return (
        capsuleDate.getDate() === date.getDate() &&
        capsuleDate.getMonth() === date.getMonth() &&
        capsuleDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatRemainingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s left`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`;
    return `${Math.floor(seconds / 3600)}h left`;
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-white/50 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map(blank => (
          <div key={`blank-${blank}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayCapsules = getCapsulesByDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={day}
              className={`aspect-square p-1 rounded-lg ${
                isToday ? 'bg-purple-600/20' : ''
              }`}
            >
              <div className="text-xs text-white/70 mb-1">{day}</div>
              <div className="space-y-1">
                {dayCapsules.map(capsule => {
                  const available = isAvailable(capsule);
                  const partiallyViewed = isPartiallyViewed(capsule);
                  return (
                    <div
                      key={capsule.id}
                      className="group relative"
                      onMouseEnter={() => setHoveredCapsule(capsule.id)}
                      onMouseLeave={() => setHoveredCapsule(null)}
                    >
                      <Link
                        to={available ? `/view/${capsule.id}` : '#'}
                        onClick={(e) => {
                          if (!available) {
                            e.preventDefault();
                            onCapsuleClick(capsule);
                          }
                        }}
                        className={`flex items-center justify-between gap-1 p-1 rounded transition-colors ${
                          partiallyViewed 
                            ? 'bg-purple-600/20 hover:bg-purple-600/30' 
                            : 'bg-white/5 hover:bg-white/10'
                        } ${available ? '' : 'opacity-75'}`}
                      >
                        <div className={`p-1 rounded text-purple-400 ${
                          partiallyViewed ? 'bg-purple-600/30' : 'bg-purple-600/20'
                        }`}>
                          <TypeIcon type={capsule.type} />
                        </div>
                        <div className="flex-shrink-0">
                          {partiallyViewed ? (
                            <Eye className="w-3 h-3 text-purple-400" />
                          ) : available ? (
                            <Unlock className="w-3 h-3 text-white/30" />
                          ) : (
                            <Lock className="w-3 h-3 text-white/30" />
                          )}
                        </div>
                      </Link>
                      {hoveredCapsule === capsule.id && (
                        <div className="absolute z-10 left-0 -top-8 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                          {capsule.name}
                          {partiallyViewed && (
                            <span className="ml-1 text-purple-400">
                              ({formatRemainingTime(capsule.remaining_duration!)})
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => onDelete(e, capsule.id)}
                        className="absolute -right-2 -top-2 p-1 rounded-full bg-white/10 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete capsule"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}