'use client';

import { useState, useEffect } from 'react';
import { IconX, IconChevronLeft, IconChevronRight, IconDownload, IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({ photos, currentIndex, isOpen, onClose, onNavigate }: PhotoLightboxProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < photos.length - 1) {
            onNavigate(currentIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.photo_url;
    link.download = `foto-dapur-${currentIndex + 1}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExternalLink = () => {
    window.open(currentPhoto.photo_url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Lightbox Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <IconX className="h-6 w-6" />
        </button>

        {/* Navigation Arrows */}
        {hasPrevious && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <IconChevronLeft className="h-6 w-6" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <IconChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Photo Counter */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          <button
            onClick={handleDownload}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            title="Download"
          >
            <IconDownload className="h-5 w-5" />
          </button>
          <button
            onClick={handleExternalLink}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            title="Buka di tab baru"
          >
            <IconExternalLink className="h-5 w-5" />
          </button>
        </div>

        {/* Photo Container */}
        <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          <Image
            src={currentPhoto.photo_url}
            alt={currentPhoto.caption || `Foto dapur ${currentIndex + 1}`}
            width={800}
            height={600}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onLoad={handleImageLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        </div>

        {/* Caption */}
        {currentPhoto.caption && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
              <p className="text-sm font-medium">{currentPhoto.caption}</p>
            </div>
          </div>
        )}

        {/* Thumbnail Navigation (if more than 1 photo) */}
        {photos.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
            <div className="flex gap-2 p-2 bg-black/50 rounded-lg backdrop-blur-sm">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => onNavigate(index)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-white/50'
                  }`}
                >
                  <Image
                    src={photo.photo_url}
                    alt={`Thumbnail ${index + 1}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


