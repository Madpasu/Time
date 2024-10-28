import React from 'react';
import { Upload } from 'lucide-react';

interface MediaUploadProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onFileChange, selectedFile }) => {
  return (
    <div className="relative">
      <input
        type="file"
        onChange={onFileChange}
        accept="image/*,video/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        required
      />
      <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors duration-200">
        <Upload className="w-8 h-8 mx-auto mb-4 text-white/70" />
        <p className="text-white/70 mb-2">
          {selectedFile ? selectedFile.name : 'Drop your file here or click to upload'}
        </p>
        <p className="text-white/50 text-sm">Supports images and videos</p>
      </div>
    </div>
  );
};