import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Type, Film, Image as ImageIcon } from 'lucide-react';
import { createTimeCapsule, uploadMedia } from '../lib/supabase';

type CapsuleType = 'text' | 'image' | 'video';

export default function CreateCapsule() {
  const navigate = useNavigate();
  const [type, setType] = useState<CapsuleType>('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let mediaPath: string | undefined;
      
      if (type === 'text') {
        await createTimeCapsule(content, type);
      } else if (file) {
        // Upload the file first
        mediaPath = await uploadMedia(file);
        // Create the capsule with the media path
        await createTimeCapsule(file.name, type, mediaPath);
      }

      navigate('/');
    } catch (err) {
      console.error('Error creating time capsule:', err);
      setError('Failed to create time capsule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Time Capsule</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            onClick={() => setType('image')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center ${
              type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}
          >
            <ImageIcon className="w-6 h-6 mb-2" />
            <span>Image</span>
          </button>
          <button
            type="button"
            onClick={() => setType('video')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center ${
              type === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
            }`}
          >
            <Film className="w-6 h-6 mb-2" />
            <span>Video</span>
          </button>
        </div>

        {type === 'text' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your message..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={4}
            required
          />
        ) : (
          <div className="relative border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              accept={type === 'image' ? 'image/*' : 'video/*'}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <Upload className="mx-auto w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              {file ? file.name : `Click to upload ${type}`}
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || (type !== 'text' && !file)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Time Capsule'}
        </button>
      </form>
    </div>
  );
}