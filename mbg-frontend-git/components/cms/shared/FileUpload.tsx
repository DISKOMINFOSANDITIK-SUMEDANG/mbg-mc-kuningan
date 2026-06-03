'use client';

import { useState, useRef, useEffect } from 'react';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';

interface FileUploadProps {
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentUrl?: string;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
  className?: string;
}

export default function FileUpload({ 
  onUpload, 
  onRemove, 
  currentUrl, 
  accept = 'image/*',
  maxSize = 5,
  folder = 'general',
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentUrl when prop changes (e.g. opening edit form)
  useEffect(() => {
    if (!localPreviewUrl) {
      setPreview(currentUrl || null);
    }
  }, [currentUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File terlalu besar. Maksimal ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (accept === 'image/*' && !file.type.startsWith('image/')) {
      setError('File harus berupa gambar');
      return;
    }

    if (accept === '.pdf' && file.type !== 'application/pdf') {
      setError('File harus berupa PDF');
      return;
    }

    setError('');

    // Show local blob preview immediately (works regardless of S3 accessibility)
    const blobUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(blobUrl);
    setPreview(blobUrl);

    setUploading(true);

    try {
      // Upload file via backend API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      // Keep blob URL for local preview; pass S3 URL to parent for persistence
      onUpload(result.url);
    } catch (error: any) {
      console.error('Upload error:', error);
      // Clean up blob URL on failure
      URL.revokeObjectURL(blobUrl);
      setLocalPreviewUrl(null);
      setPreview(currentUrl || null);
      setError(error.message || 'Gagal mengupload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setPreview(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          {accept === 'image/*' ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <IconPhoto className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">File terupload</p>
                <p className="text-xs text-gray-500">{preview.split('/').pop()}</p>
              </div>
            </div>
          )}

          {/* Uploading overlay on top of preview */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
              <div className="text-center text-white">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm font-medium">Mengupload...</p>
              </div>
            </div>
          )}

          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Hapus file"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {uploading ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Mengupload file...</p>
              <p className="text-xs text-gray-500">Mohon tunggu sebentar</p>
            </div>
          ) : (
            <div className="text-center">
              <IconUpload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Klik untuk upload {accept === 'image/*' ? 'gambar' : 'file'}
              </p>
              <p className="text-xs text-gray-500">Maksimal {maxSize}MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Gagal</h3>
              <div className="mt-1 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
