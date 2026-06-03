'use client';

import { useEffect, useState } from 'react';
import { IconMapPin, IconPhone, IconClock, IconUsers, IconBuilding, IconChefHat, IconCamera, IconUser, IconCertificate, IconDownload, IconCalendar } from '@tabler/icons-react';
import { SPPG, getGroups, getSchoolById } from '@/lib/api-client';
import MapView from '@/components/shared/MapView';
import PhotoLightbox from '@/components/shared/PhotoLightbox';

interface KitchenPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
}

interface RawSchool {
  id?: string;
  name?: string;
  schoolName?: string;
  title?: string;
  address?: string;
  location?: string;
  studentCount?: number;
  students?: number;
  level?: string;
  educationLevel?: string;
  status?: string;
}

interface NormalizedSchool {
  id?: string;
  name: string;
  address: string;
  studentCount: number | null;
  level: string | null;
  status: string;
}

interface Nutritionist {
  name?: string;
  photo?: string;
  qualification?: string;
  experience?: string;
}

interface SLHSCertificate {
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileUrl?: string;
}

interface ExtendedSPPG {
  kitchenPhoto?: string;
  nutritionist?: Nutritionist;
  slhsCertificate?: SLHSCertificate;
}

interface GroupSPPGDetailProps {
  sppg: SPPG;
}

export default function GroupSPPGDetail({ sppg }: GroupSPPGDetailProps) {
  // Normalize groups array if available on sppg or fallback to empty
  const rawGroups = Array.isArray((sppg as any).groups) ? (sppg as any).groups : [];
  const groups = rawGroups.map((g: any) => {
    if (!g) return null;
    if (typeof g === 'string') {
      return { id: g, name: `ID: ${g}`, description: 'Deskripsi tidak tersedia' };
    }
    return {
      id: g.id ?? undefined,
      name: g.name ?? g.title ?? 'Nama tidak tersedia',
      description: g.description ?? 'Deskripsi tidak tersedia'
    };
  }).filter(Boolean);

  // Schools served (IDs -> fetch detail)
  const rawSchools = Array.isArray((sppg as any).schools) ? (sppg as any).schools : [];
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState<boolean>(false);
  const [kitchenPhotos, setKitchenPhotos] = useState<KitchenPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const normalize = (s: RawSchool | null): NormalizedSchool | null => {
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
        const stringIds = rawSchools.filter((x: unknown): x is string => typeof x === 'string');
        const objEntries = rawSchools.filter((x: unknown): x is RawSchool => typeof x === 'object' && x !== null);

        const normalizedObjects = objEntries.map(normalize).filter((item: NormalizedSchool | null): item is NormalizedSchool => item !== null);

        let fetched: NormalizedSchool[] = [];
        if (stringIds.length > 0) {
          const fetchedResults = await Promise.all(stringIds.map((id: string) => getSchoolById(id).catch(() => null)));
          fetched = fetchedResults
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .map(normalize)
            .filter((item): item is NormalizedSchool => item !== null);
        }

        if (isMounted) {
          setSchools([...normalizedObjects, ...fetched]);
        }
      } finally {
        if (isMounted) setSchoolsLoading(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [rawSchools]);

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

  // Visibility guards similar to SPPGDetail when fields are present on sppg
  const extendedSppg = sppg as SPPG & ExtendedSPPG;
  const hasKitchenPhoto = !!extendedSppg?.kitchenPhoto;
  const nutritionist: Nutritionist | null = extendedSppg?.nutritionist || null;
  const hasNutritionist = !!(
    nutritionist && (nutritionist.name || nutritionist.photo || nutritionist.qualification || nutritionist.experience)
  );
  const slhs: SLHSCertificate | null = extendedSppg?.slhsCertificate || null;
  const hasSLHS = !!(
    slhs && (slhs.certificateNumber || slhs.issueDate || slhs.expiryDate || slhs.fileUrl)
  );

  const isBlank = (v: unknown): boolean => {
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
      <div className="bg-green-600 px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <IconChefHat className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{sppg.name}</h2>
            </div>
            <p className="text-green-100 text-lg">{sppg.type}</p>
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
                <p className="text-sm text-gray-500 mt-1">{sppg.contact?.address || sppg.address || '-'}</p>
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
                <p className="text-gray-600">{sppg.operatingHours?.start || sppg.operating_hours_start || '-'} - {sppg.operatingHours?.end || sppg.operating_hours_end || '-'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <IconPhone className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Kontak</h3>
                <p className="text-gray-600">{sppg.contact?.phone || sppg.phone || '-'}</p>
                <p className="text-sm text-gray-500 mt-1">{sppg.contact?.email || sppg.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <IconBuilding className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Kelompok yang Dilayani</h3>
                <p className="text-gray-600">{groups.length} kelompok</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconMapPin className="h-5 w-5 mr-2 text-green-600" />
            Lokasi Dapur
          </h3>
          <MapView
            latitude={sppg.coordinates?.lat || sppg.latitude || null}
            longitude={sppg.coordinates?.lng || sppg.longitude || null}
            title={sppg.name}
            description={`${sppg.type} - ${sppg.location}`}
            height="400px"
            className="mb-6"
          />
        </div>

        {/* Facilities */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fasilitas Dapur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(sppg.facilities || []).map((facility, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">{facility}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen Photos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconCamera className="h-5 w-5 mr-2 text-green-600" />
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

        {/* Nutritionist Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconUser className="h-5 w-5 mr-2 text-green-600" />
            Data Ahli Gizi
          </h3>
          {!isNutritionistEmpty ? (
            <div className="bg-green-50 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {!isBlank(nutritionist.photo) ? (
                    <img 
                      src={nutritionist.photo} 
                      alt={nutritionist.name || 'Ahli gizi'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center">
                      <IconUser className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {!isBlank(nutritionist.name) && (
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{nutritionist.name}</h4>
                  )}
                  {!isBlank(nutritionist.qualification) && (
                    <p className="text-green-600 font-medium mb-2">{nutritionist.qualification}</p>
                  )}
                  {!isBlank(nutritionist.experience) && (
                    <p className="text-gray-600 text-sm">{nutritionist.experience}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <IconUser className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600">Tidak tersedia.</p>
            </div>
          )}
        </div>

        {/* SLHS Certificate */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <IconCertificate className="h-5 w-5 mr-2 text-red-600" />
            Sertifikat Laik Higiene Sanitasi (SLHS)
          </h3>
          {!isSLHSEmpty ? (
            <div className="bg-red-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <IconCertificate className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Sertifikat SLHS</h4>
                      {!isBlank(slhs.certificateNumber) && (
                        <p className="text-sm text-gray-600">No. {slhs.certificateNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {!isBlank(slhs.issueDate) && (
                      <div className="flex items-center space-x-2">
                        <IconCalendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Diterbitkan: {slhs.issueDate ? new Date(slhs.issueDate).toLocaleDateString('id-ID') : 'Tidak tersedia'}</span>
                      </div>
                    )}
                    {!isBlank(slhs.expiryDate) && (
                      <div className="flex items-center space-x-2">
                        <IconCalendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Berlaku hingga: {slhs.expiryDate ? new Date(slhs.expiryDate).toLocaleDateString('id-ID') : 'Tidak tersedia'}</span>
                      </div>
                    )}
                  </div>
                </div>
                {!isBlank(slhs.fileUrl) && (
                  <a
                    href={slhs.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <IconDownload className="h-4 w-4" />
                    <span className="text-sm font-medium">Download PDF</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <IconCertificate className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600">Tidak tersedia.</p>
            </div>
          )}
        </div>

        {/* Groups Served */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kelompok yang Dilayani</h3>
          {groups.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">Belum ada data kelompok yang dilayani.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group: any, index: number) => (
                <div key={group.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-600">{group.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Kelompok Masyarakat
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schools Served */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sekolah yang Dilayani</h3>
          {schoolsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse h-16" />
              ))}
            </div>
          ) : schools.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600">Belum ada data sekolah yang dilayani.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schools.map((school: any, index: number) => (
                <div key={school.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{school.name}</h4>
                    <p className="text-sm text-gray-600">{school.address || 'Alamat tidak tersedia'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{school.studentCount != null ? `${school.studentCount.toLocaleString()} siswa` : 'Jumlah siswa tidak tersedia'}</span>
                      <span>•</span>
                      <span>{school.level || 'Jenjang tidak tersedia'}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        school.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : school.status === 'Pilot'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {school.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
