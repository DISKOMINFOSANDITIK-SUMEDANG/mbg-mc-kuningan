'use client';

import { useEffect, useState } from 'react';
import {
  IconBuilding,
  IconPhone,
  IconMapPin,
  IconClock,
  IconChefHat,
  IconCamera,
  IconUser,
  IconUsers,
  IconCertificate,
  IconCalendar,
  IconDownload,
  IconMail
} from '@tabler/icons-react';
import { getSchools, getSchoolById } from '@/lib/api-client';
import MapView from '@/components/shared/MapView';
import PhotoLightbox from '@/components/shared/PhotoLightbox';
import Image from 'next/image';

interface KitchenPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

interface SPPGData {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  address?: string;
  operating_hours_start?: string;
  operating_hours_end?: string;
  kitchen_photo_url?: string;
  foundation_id?: string;
  created_at?: string;
  updated_at?: string;
  schools?: unknown[];
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  operatingHours?: {
    start?: string;
    end?: string;
  };
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  facilities?: string[];
}

interface SPPGDetailProps {
  sppg: SPPGData;
}

interface NormalizedSchool {
  id?: string;
  name: string;
  address: string;
  studentCount: number | null;
  level: string | null;
  status: string;
  sppgId?: string;
}

interface Nutritionist {
  id: string;
  name: string;
  qualification: string;
  experience: string;
  photo_url: string;
  sppg_id: string;
}

interface SLHSCertificate {
  fileUrl: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
}

export default function SPPGDetail({ sppg }: SPPGDetailProps) {
  const [schools, setSchools] = useState<NormalizedSchool[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [kitchenPhotos, setKitchenPhotos] = useState<KitchenPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [nutritionist, setNutritionist] = useState<Nutritionist | null>(null);
  const [nutritionistLoading, setNutritionistLoading] = useState(true);

  const rawSchools = sppg.schools || [];

  useEffect(() => {
    let isMounted = true;

    const normalize = (school: Record<string, unknown>): NormalizedSchool | null => {
      if (!school || typeof school !== 'object') return null;
      
      return {
        id: typeof school.id === 'string' ? school.id : undefined,
        name: (school.name || school.schoolName || school.title || 'Nama tidak tersedia') as string,
        address: (school.address || school.location || 'Alamat tidak tersedia') as string,
        studentCount: typeof school.studentCount === 'number' ? school.studentCount : (typeof school.students === 'number' ? school.students : null),
        level: (school.level || school.educationLevel || null) as string | null,
        status: (school.status || 'Unknown') as string,
        sppgId: typeof school.sppg_id === 'string' ? school.sppg_id : undefined
      };
    };

    const load = async () => {
      try {
        setSchoolsLoading(true);
        
        // Fetch schools directly from API that are associated with this SPPG
        try {
          const schoolsResponse = await fetch(`/api/schools?sppg_id=${sppg.id}`);
          if (schoolsResponse.ok) {
            const schoolsData = await schoolsResponse.json();
            const normalizedSchools = schoolsData.map((school: Record<string, unknown>) => normalize(school)).filter((school: NormalizedSchool | null): school is NormalizedSchool => school !== null);
            
            if (isMounted) {
              setSchools(normalizedSchools);
            }
          }
        } catch (error) {
          console.error('Error fetching schools:', error);
        }
      } catch (error) {
        console.error('Error loading schools:', error);
      } finally {
        if (isMounted) {
          setSchoolsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [sppg.id, rawSchools]);

  useEffect(() => {
    const loadKitchenPhotos = async () => {
      try {
        setPhotosLoading(true);
        
        // Fetch real kitchen photos from API
        const response = await fetch(`/api/sppgs/${sppg.id}/kitchen-photos`);
        if (response.ok) {
          const photos = await response.json();
          setKitchenPhotos(photos);
        } else {
          // If no photos found, set empty array
          setKitchenPhotos([]);
        }
      } catch (error) {
        console.error('Error loading kitchen photos:', error);
        setKitchenPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };

    loadKitchenPhotos();
  }, [sppg.id]);

  useEffect(() => {
    const loadNutritionist = async () => {
      try {
        setNutritionistLoading(true);
        
        // Fetch real nutritionist data from API
        const response = await fetch(`/api/sppgs/${sppg.id}/nutritionist`);
        if (response.ok) {
          const nutritionistData = await response.json();
          setNutritionist(nutritionistData);
        } else {
          setNutritionist(null);
        }
      } catch (error) {
        console.error('Error loading nutritionist:', error);
        setNutritionist(null);
      } finally {
        setNutritionistLoading(false);
      }
    };

    loadNutritionist();
  }, [sppg.id]);

  // Mock data for SLHS certificate (keeping this as mock for now)
  const slhs: SLHSCertificate = {
    fileUrl: '/documents/slhs-certificate.pdf',
    issueDate: '2023-01-15',
    expiryDate: '2026-01-15',
    certificateNumber: 'SLHS-2023-001'
  };

  const isBlank = (value: unknown): boolean => {
    return value === null || value === undefined || value === '';
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const totalStudents = schools.reduce((sum, school) => sum + (school.studentCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IconChefHat className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sppg.name}</h1>
                <p className="text-gray-600">{sppg.type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <IconMapPin className="h-5 w-5" />
                <span>{sppg.location}</span>
              </div>
              {sppg.phone && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <IconPhone className="h-5 w-5" />
                  <span>{sppg.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <IconUsers className="h-5 w-5" />
                <span>{(sppg.capacity || 0).toLocaleString()} porsi/hari</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <IconBuilding className="h-6 w-6 mr-2 text-blue-600" />
              Informasi Dasar
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama SPPG</label>
                  <p className="text-gray-900">{sppg.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipe</label>
                  <p className="text-gray-900">{sppg.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kapasitas</label>
                  <p className="text-gray-900">{(sppg.capacity || 0).toLocaleString()} porsi/hari</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lokasi</label>
                  <p className="text-gray-900">{sppg.location}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Kontak & Operasional</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Telepon</label>
                  <p className="text-gray-900">{sppg.contact?.phone || sppg.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{sppg.contact?.email || sppg.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Alamat</label>
                  <p className="text-gray-900">{sppg.contact?.address || sppg.address || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Jam Operasional</label>
                  <p className="text-gray-900 flex items-center">
                    <IconClock className="h-4 w-4 mr-1" />
                    {sppg.operatingHours?.start || sppg.operating_hours_start || '-'} - {sppg.operatingHours?.end || sppg.operating_hours_end || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          {((sppg.coordinates?.lat && sppg.coordinates?.lng) || (sppg.latitude && sppg.longitude)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <IconMapPin className="h-6 w-6 mr-2 text-blue-600" />
                Lokasi
              </h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <MapView
                  latitude={sppg.coordinates?.lat || sppg.latitude || null}
                  longitude={sppg.coordinates?.lng || sppg.longitude || null}
                  title={sppg.name}
                  description={sppg.address}
                  height="256px"
                />
              </div>
            </div>
          )}

          {/* Facilities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fasilitas</h2>
            {sppg.facilities && sppg.facilities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sppg.facilities.map((facility: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <IconBuilding className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{facility}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Informasi fasilitas belum tersedia</p>
            )}
          </div>

          {/* Kitchen Photos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <IconCamera className="h-6 w-6 mr-2 text-blue-600" />
              Foto Dapur
            </h2>
            
            {photosLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : kitchenPhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kitchenPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group cursor-pointer" onClick={() => openLightbox(index)}>
                    <Image
                      src={photo.photo_url}
                      alt={photo.caption || 'Foto Dapur'}
                      width={400}
                      height={300}
                      unoptimized={true}
                      className="w-full aspect-video object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <IconCamera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {photo.caption && (
                      <p className="text-sm text-gray-600 mt-2">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : sppg.kitchen_photo_url ? (
              <div className="mt-4">
                <Image
                  src={sppg.kitchen_photo_url}
                  alt="Foto Dapur"
                  width={400}
                  height={300}
                  unoptimized
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">Foto Dapur - 1 dari 3</p>
              </div>
            ) : (
              <p className="text-gray-500">Foto dapur belum tersedia</p>
            )}
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Schools Served */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <IconUsers className="h-6 w-6 mr-2 text-blue-600" />
              Sekolah yang Dilayani
            </h2>
            
            {schoolsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : schools.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">
                  Total: {schools.length} sekolah • {totalStudents.toLocaleString()} siswa
                </div>
                {schools.map((school, index) => (
                  <div key={school.id || index} className="p-3 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">{school.name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {school.level && <p>Jenjang: {school.level}</p>}
                      {school.studentCount && <p>Siswa: {school.studentCount.toLocaleString()}</p>}
                      {!isBlank(school.address) && <p>Alamat: {String(school.address)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Belum ada sekolah yang terdaftar</p>
            )}
          </div>

          {/* Nutritionist */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <IconUser className="h-6 w-6 mr-2 text-blue-600" />
              Ahli Gizi
            </h2>
            
            {nutritionistLoading ? (
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto mb-2 animate-pulse" style={{width: '120px'}}></div>
                <div className="h-3 bg-gray-200 rounded mx-auto mb-1 animate-pulse" style={{width: '80px'}}></div>
                <div className="h-3 bg-gray-200 rounded mx-auto animate-pulse" style={{width: '100px'}}></div>
              </div>
            ) : nutritionist ? (
              <div className="text-center">
                <div className="mb-4">
                  <Image
                    src={nutritionist.photo_url || '/images/nutritionist-placeholder.jpg'}
                    alt={`Foto ${nutritionist.name}`}
                    width={200}
                    height={200}
                    unoptimized
                    className="w-24 h-24 object-cover rounded-full mx-auto border-4 border-gray-100"
                  />
                </div>
                <h3 className="font-semibold text-gray-900">{nutritionist.name}</h3>
                <p className="text-sm text-gray-600">{nutritionist.qualification}</p>
                <p className="text-sm text-gray-500 mt-1">Pengalaman: {nutritionist.experience}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <IconUser className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-500">Data ahli gizi belum tersedia</p>
              </div>
            )}
          </div>

          {/* SLHS Certificate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <IconCertificate className="h-6 w-6 mr-2 text-blue-600" />
              Sertifikat SLHS
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nomor Sertifikat</label>
                <p className="text-gray-900">{slhs.certificateNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Terbit</label>
                <p className="text-gray-900 flex items-center">
                  <IconCalendar className="h-4 w-4 mr-1" />
                  {new Date(slhs.issueDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tanggal Kadaluarsa</label>
                <p className="text-gray-900 flex items-center">
                  <IconCalendar className="h-4 w-4 mr-1" />
                  {new Date(slhs.expiryDate).toLocaleDateString('id-ID')}
                </p>
              </div>
              <a
                href={slhs.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconDownload className="h-4 w-4" />
                Unduh Sertifikat
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={kitchenPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(index) => setLightboxIndex(index)}
        />
      )}
    </div>
  );
}
