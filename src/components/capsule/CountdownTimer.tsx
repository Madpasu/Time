import React from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds }) => {
  return (
    <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
      <Timer className="w-4 h-4 text-purple-400" />
      <span className="text-white font-mono">{seconds}s</span>
    </div>
  );
};