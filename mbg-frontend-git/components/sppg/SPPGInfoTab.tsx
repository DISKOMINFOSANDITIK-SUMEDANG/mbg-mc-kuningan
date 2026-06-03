'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IconMapPin, IconPhone, IconClock, IconUsers, IconBuilding, IconCamera, IconUser, IconCertificate, IconDownload, IconCalendar, IconChevronRight, IconMail } from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import { SPPG, getSchoolById } from '@/lib/api-client';
import MapView from '@/components/shared/MapView';
import PhotoLightbox from '@/components/shared/PhotoLightbox';

interface KitchenPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

interface SPPGInfoTabProps {
  sppg: SPPG;
}

const sanitizeExperienceHtml = (value: string) =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });

export default function SPPGInfoTab({ sppg }: SPPGInfoTabProps) {
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState<boolean>(false);
  const [kitchenPhotos, setKitchenPhotos] = useState<KitchenPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    // Normalize schools array into a consistent shape for rendering
    const rawSchools = Array.isArray((sppg as any).schools) ? (sppg as any).schools : [];
    const normalize = (s: any) => {
      if (!s) return null;
      return {
        id: s.id ?? undefined,
        name: s.name ?? s.schoolName ?? s.title ?? 'Nama tidak tersedia',
        address: s.address ?? s.location ?? 'Alamat tidak tersedia',
        studentCount: typeof s.studentCount === 'number' ? s.studentCount : (typeof s.students === 'number' ? s.students : null),
        level: s.level ?? s.educationLevel ?? null,
        status: s.status ?? 'Unknown'
      };
    };

    const load = async () => {
      try {
        setSchoolsLoading(true);
        const stringIds = rawSchools.filter((x: any) => typeof x === 'string');
        const objEntries = rawSchools.filter((x: any) => typeof x === 'object');

        const normalizedObjects = objEntries.map(normalize).filter(Boolean) as any[];

        let fetched: any[] = [];
        if (stringIds.length > 0) {
          fetched = (await Promise.all(stringIds.map((id: string) => getSchoolById(id).catch(() => null))))
            .filter(Boolean)
            .map(normalize)
            .filter(Boolean) as any[];
        }

        if (isMounted) {
          setSchools([...normalizedObjects, ...fetched]);
        }
      } finally {
        if (isMounted) setSchoolsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [sppg.id, sppg]);

  // Fetch kitchen photos
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

  // Normalized objects for conditional field rendering
  const nutritionist: any = (sppg as any)?.nutritionist || null;
  const slhs: any = (sppg as any)?.slhsCertificate || null;

  const isBlank = (v: any) => {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') return v.trim() === '';
    return false;
  };

  const isNutritionistEmpty = !nutritionist || (
    isBlank(nutritionist.name) &&
    isBlank(nutritionist.photo) &&
    isBlank(nutritionist.qualification) &&
    isBlank(nutritionist.experience)
  );

  const isSLHSEmpty = !slhs || (
    isBlank(slhs.certificateNumber) &&
    isBlank(slhs.issueDate) &&
    isBlank(slhs.expiryDate) &&
    isBlank(slhs.fileUrl)
  );

  return (
    <div className="space-y-8">
      {/* Basic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <IconMapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Lokasi</h3>
          </div>
          <p className="text-gray-600 text-sm">{sppg.location}</p>
          <p className="text-gray-500 text-xs mt-1">{sppg.contact?.address || sppg.address || '-'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <IconUsers className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Kapasitas</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(sppg.capacity || 0).toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">porsi per hari</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <IconClock className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Operasional</h3>
          </div>
          <p className="text-gray-600 font-medium">{sppg.operatingHours?.start || sppg.operating_hours_start || '-'} - {sppg.operatingHours?.end || sppg.operating_hours_end || '-'}</p>
          <p className="text-gray-500 text-xs mt-1">Senin - Jumat</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <IconBuilding className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Sekolah</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
          <p className="text-gray-500 text-xs mt-1">sekolah dilayani</p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 bg-white rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconPhone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Telepon</p>
              <p className="text-gray-900 font-medium">{sppg.contact?.phone || sppg.phone || '-'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconMail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-gray-900 font-medium truncate">{sppg.contact?.email || sppg.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
              <IconMapPin className="h-5 w-5 text-blue-600" />
            </div>
            Lokasi Dapur
          </h3>
        </div>
        <MapView
          latitude={sppg.coordinates?.lat || sppg.latitude || null}
          longitude={sppg.coordinates?.lng || sppg.longitude || null}
          title={sppg.name}
          description={`${sppg.type} - ${sppg.location}`}
          height="400px"
        />
      </div>

      {/* Facilities */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
            <IconBuilding className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Fasilitas Dapur</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(sppg.facilities || []).map((facility, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 text-sm">{facility}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kitchen Photos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-5">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
            <IconCamera className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Foto Dapur</h3>
        </div>
        {photosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : kitchenPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kitchenPhotos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 hover:border-purple-300 transition-all duration-300" 
                onClick={() => handlePhotoClick(index)}
              >
                <Image
                  src={photo.photo_url}
                  alt={photo.caption || `Foto dapur ${sppg.name} ${index + 1}`}
                  width={400}
                  height={300}
                  unoptimized
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                    <p className="text-sm font-medium truncate">{photo.caption}</p>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {index + 1}/{kitchenPhotos.length}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                      <IconCamera className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
              <IconCamera className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Tidak ada foto dapur tersedia</p>
            <p className="text-gray-400 text-sm mt-1">Foto akan ditampilkan di sini</p>
          </div>
        )}
      </div>

      {/* Nutritionist Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
            <IconUser className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Data Ahli Gizi</h3>
        </div>
        {!isNutritionistEmpty ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {!isBlank(nutritionist.photo) ? (
                  <Image 
                    src={nutritionist.photo} 
                    alt={nutritionist.name || 'Ahli gizi'}
                    width={80}
                    height={80}
                    unoptimized
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                    <IconUser className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                {!isBlank(nutritionist.name) && (
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{nutritionist.name}</h4>
                )}
                {!isBlank(nutritionist.qualification) && (
                  <p className="text-green-700 font-semibold mb-2">{nutritionist.qualification}</p>
                )}
                {!isBlank(nutritionist.experience) && (
                  <div
                    className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeExperienceHtml(nutritionist.experience) }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <IconUser className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Data ahli gizi tidak tersedia</p>
            <p className="text-gray-400 text-sm mt-1">Informasi akan ditampilkan di sini</p>
          </div>
        )}
      </div>

      {/* SLHS Certificate */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mr-3">
            <IconCertificate className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Sertifikat Laik Higiene Sanitasi (SLHS)</h3>
        </div>
        {!isSLHSEmpty ? (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-100">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <IconCertificate className="h-7 w-7 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">Sertifikat SLHS</h4>
                    {!isBlank(slhs.certificateNumber) && (
                      <p className="text-sm text-gray-600 font-medium mt-1">No. {slhs.certificateNumber}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!isBlank(slhs.issueDate) && (
                    <div className="flex items-center space-x-2 bg-white rounded-lg p-3">
                      <IconCalendar className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Diterbitkan</p>
                        <p className="text-sm text-gray-900 font-medium">{new Date(slhs.issueDate).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  )}
                  {!isBlank(slhs.expiryDate) && (
                    <div className="flex items-center space-x-2 bg-white rounded-lg p-3">
                      <IconCalendar className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Berlaku hingga</p>
                        <p className="text-sm text-gray-900 font-medium">{new Date(slhs.expiryDate).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isBlank(slhs.fileUrl) && (
                <a
                  href={slhs.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:shadow-lg font-medium"
                >
                  <IconDownload className="h-5 w-5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <IconCertificate className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Sertifikat tidak tersedia</p>
            <p className="text-gray-400 text-sm mt-1">Dokumen sertifikat akan ditampilkan di sini</p>
          </div>
        )}
      </div>

      {/* Schools Served */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mr-3">
              <IconBuilding className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sekolah yang Dilayani</h3>
          </div>
          {!schoolsLoading && schools.length > 0 && (
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
              {schools.length} Sekolah
            </div>
          )}
        </div>
        {schoolsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 bg-gray-100 rounded-xl animate-pulse h-24" />
            ))}
          </div>
        ) : schools.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <IconBuilding className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Belum ada data sekolah</p>
            <p className="text-gray-400 text-sm mt-1">Sekolah yang dilayani akan ditampilkan di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schools.map((school: any, index: number) => (
              <Link
                key={school.id || index}
                href={`/schools/${school.id}`}
                className="group flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-orange-50/30 hover:from-orange-50 hover:to-orange-100/50 rounded-xl border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors line-clamp-1">
                      {school.name}
                    </h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                      school.status === 'Active'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : school.status === 'Pilot'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {school.status || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    <IconMapPin className="h-3.5 w-3.5 inline mr-1" />
                    {school.address || 'Alamat tidak tersedia'}
                  </p>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-600 flex items-center">
                      <IconUsers className="h-4 w-4 mr-1.5 text-gray-400" />
                      {school.studentCount != null ? `${school.studentCount.toLocaleString()} siswa` : 'Jumlah siswa tidak tersedia'}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-600 font-medium">{school.level || 'Jenjang tidak tersedia'}</span>
                  </div>
                </div>
                <IconChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          isOpen={lightboxOpen}
          photos={kitchenPhotos}
          currentIndex={lightboxIndex}
          onClose={handleLightboxClose}
          onNavigate={handleLightboxNavigate}
        />
      )}
    </div>
  );
}
