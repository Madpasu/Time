import React, { useState } from 'react';
import { Upload, Send, Image, FileVideo, Type, Calendar, Clock } from 'lucide-react';
import { createTimeCapsule, uploadMedia } from '../lib/supabase';

interface CreateCapsuleProps {
  onSuccess?: () => void;
}

export function CreateCapsule({ onSuccess }: CreateCapsuleProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'video'>('text');
  const [availableAt, setAvailableAt] = useState<string>('');
  const [name, setName] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(15);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setAvailableAt(now.toISOString().slice(0, 16));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
        setError('File size must be less than 50MB');
        return;
      }

      if (selectedFile.type.startsWith('image/')) {
        setType('image');
        setFile(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        setType('video');
        setFile(selectedFile);
      } else {
        setError('Please upload an image or video file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let mediaPath = '';
      
      if (file) {
        mediaPath = await uploadMedia(file);
        if (!mediaPath) {
          throw new Error('Failed to upload media');
        }
      }

      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      if (totalSeconds < 5) {
        throw new Error('View duration must be at least 5 seconds');
      }

      await createTimeCapsule({
        type,
        content: type === 'text' ? content : file?.name || '',
        media_path: mediaPath,
        available_at: new Date(availableAt).toISOString(),
        name: name.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} Capsule`,
        view_duration: totalSeconds,
      });

      setContent('');
      setFile(null);
      setType('text');
      setName('');
      setHours(0);
      setMinutes(0);
      setSeconds(15);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }
    } catch (err) {
      console.error('Error creating time capsule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create time capsule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Time Capsule</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Capsule Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your capsule"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setType('text')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center ${
              type === 'text' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}
          >
            <Type className="w-6 h-6 mb-2" />
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('image');
              fileInputRef.current?.click();
            }}
            className={`p-4 rounded-lg flex flex-col items-center justify-center ${
              type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}
          >
            <Image className="w-6 h-6 mb-2" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('video');
              fileInputRef.current?.click();
            }}
            className={`p-4 rounded-lg flex flex-col items-center justify-center ${
              type === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}
          >
            <FileVideo className="w-6 h-6 mb-2" />
            <span>Video</span>
          </button>
        </div>

        {type === 'text' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your message..."
            className="w-full h-40 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            required
          />
        ) : file ? (
          <div className="relative bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={type === 'image' ? 'image/*' : 'video/*'}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {type === 'image' ? 'PNG, JPG, GIF up to 10MB' : 'MP4, WebM up to 50MB'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4" />
              Available From
            </div>
            <input
              type="datetime-local"
              value={availableAt}
              onChange={(e) => setAvailableAt(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              View Duration
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-500 mt-1 block">Hours</span>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-500 mt-1 block">Minutes</span>
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-500 mt-1 block">Seconds</span>
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || (!content && !file)}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Create Time Capsule
            </>
          )}
        </button>
      </form>
    </div>
  );
}