'use client';

import { IconPhoto, IconFileText, IconDownload, IconExternalLink } from '@tabler/icons-react';

interface FileDisplayProps {
  url: string;
  type?: 'image' | 'pdf' | 'auto';
  className?: string;
  showDownload?: boolean;
  showExternal?: boolean;
}

export default function FileDisplay({ 
  url, 
  type = 'auto', 
  className = '',
  showDownload = true,
  showExternal = true
}: FileDisplayProps) {
  const isImage = type === 'image' || (type === 'auto' && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url));
  const isPdf = type === 'pdf' || (type === 'auto' && /\.pdf(\?|$)/i.test(url));

  if (!url) {
    return (
      <div className={`w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <IconPhoto className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Tidak ada file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {isImage ? (
        <img
          src={url}
          alt="File preview"
          className={className || "w-full h-48 object-cover rounded-lg border border-gray-200"}
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/400x300/cccccc/666666?text=Gambar+Tidak+Ditemukan';
          }}
        />
      ) : isPdf ? (
        <div className={className || "w-full h-48 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center"}>
          <div className="text-center">
            <IconFileText className="h-12 w-12 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-red-800 font-medium">File PDF</p>
            <p className="text-xs text-red-600">{url.split('/').pop()}</p>
          </div>
        </div>
      ) : (
        <div className={className || "w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"}>
          <div className="text-center">
            <IconFileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">File</p>
            <p className="text-xs text-gray-500">{url.split('/').pop()}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          {showDownload && (
            <a
              href={url}
              download
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Download file"
            >
              <IconDownload className="h-4 w-4" />
            </a>
          )}
          {showExternal && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              title="Buka di tab baru"
            >
              <IconExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
