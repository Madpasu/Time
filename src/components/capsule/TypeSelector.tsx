import React from 'react';
import { FileText, Image, Video } from 'lucide-react';
import { CapsuleType } from '../../types/timeCapsule';

interface TypeSelectorProps {
  selectedType: CapsuleType;
  onTypeSelect: (type: CapsuleType) => void;
}

export const TypeSelector: React.FC<TypeSelectorProps> = ({ selectedType, onTypeSelect }) => {
  const types = [
    { id: 'text' as CapsuleType, icon: FileText, label: 'Text' },
    { id: 'image' as CapsuleType, icon: Image, label: 'Image' },
    { id: 'video' as CapsuleType, icon: Video, label: 'Video' },
  ];

  return (
    <div className="flex gap-4 mb-6">
      {types.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTypeSelect(id)}
          className={`flex-1 p-4 rounded-lg border transition-all duration-200 ${
            selectedType === id
              ? 'border-purple-500 bg-purple-500/10 text-white'
              : 'border-white/10 hover:border-purple-500/50 text-white/70 hover:text-white'
          }`}
        >
          <Icon className="w-6 h-6 mx-auto mb-2" />
          <span className="block text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
};