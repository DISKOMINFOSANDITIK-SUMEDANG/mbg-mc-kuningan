'use client';

import { useState, useEffect } from 'react';
import { IconMapPin, IconPhone, IconClock, IconUsers, IconBuilding, IconChefHat, IconCamera } from '@tabler/icons-react';
import { SPPG, getSchoolsBySPPG } from '@/lib/data';
import PhotoLightbox from '@/components/shared/PhotoLightbox';

interface KitchenPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

interface SPPGDetailProps {
  sppg: SPPG;
}

export default function SPPGDetail({ sppg }: SPPGDetailProps) {
  const schools = getSchoolsBySPPG(sppg.id);
  const [kitchenPhotos, setKitchenPhotos] = useState<KitchenPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchKitchenPhotos = async () => {
      try {
        const response = await fetch(`/api/sppgs/${sppg.id}/kitchen-photos`);
        if (response.ok) {
          const photos = await response.json();
          setKitchenPhotos(photos);
        }
      } catch (error) {
        console.error('Error fetching kitchen photos:', error);
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchKitchenPhotos();
  }, [sppg.id]);

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  const handleLightboxNavigate = (index: number) => {
    setLightboxIndex(index);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dapur Satelit Modular':
        return 'bg-blue-100 text-blue-800';
      case 'Dapur Konvensional':
        return 'bg-green-100 text-green-800';
      case 'Dapur Pusat':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <IconChefHat className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{sppg.name}</h2>
            </div>
            <p className="text-blue-100 text-lg">{sppg.type}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(sppg.type)}`}>
            {sppg.type}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <IconMapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Lokasi</h3>
                <p className="text-gray-600">{sppg.location}</p>
                <p className="text-sm text-gray-500 mt-1">{sppg.contact.address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <IconUsers className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Kapasitas</h3>
                <p className="text-gray-600">{(sppg.capacity || 0).toLocaleString()} porsi per hari</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <IconClock className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Jam Operasional</h3>
                <p className="text-gray-600">{sppg.operatingHours.start} - {sppg.operatingHours.end}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <IconPhone className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Kontak</h3>
                <p className="text-gray-600">{sppg.contact.phone}</p>
                <p className="text-sm text-gray-500 mt-1">{sppg.contact.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <IconBuilding className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Sekolah yang Dilayani</h3>
                <p className="text-gray-600">{schools.length} sekolah</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Photos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconCamera className="h-5 w-5 mr-2 text-blue-600" />
            Foto Dapur
          </h3>
          {photosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : kitchenPhotos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchenPhotos.map((photo, index) => (
                <div key={photo.id} className="relative group cursor-pointer" onClick={() => handlePhotoClick(index)}>
                  <div className="aspect-w-16 aspect-h-12">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || `Foto dapur ${sppg.name} ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                    />
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3 rounded-b-lg">
                      <p className="text-sm font-medium truncate">{photo.caption}</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <IconCamera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <IconCamera className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">Tidak ada foto dapur tersedia</p>
            </div>
          )}
        </div>

        {/* Facilities */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fasilitas Dapur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sppg.facilities.map((facility, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">{facility}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schools Served */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sekolah yang Dilayani</h3>
          <div className="space-y-3">
            {schools.map((school) => (
              <div key={school.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{school.name}</h4>
                  <p className="text-sm text-gray-600">{school.address}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{school.studentCount} siswa</span>
                    <span>•</span>
                    <span>{school.level}</span>
                    <span>•</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      school.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : school.status === 'Pilot'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {school.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={kitchenPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  );
}
