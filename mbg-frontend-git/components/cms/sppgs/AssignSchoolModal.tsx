'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  IconX, 
  IconSearch, 
  IconSchool, 
  IconMapPin,
  IconAlertCircle,
  IconCheck,
  IconUserCheck,
  IconPlus
} from '@tabler/icons-react';

interface School {
  id: string;
  name: string;
  address: string;
  district: string;
  sppg_id: string | null;
  assigned_sppg_name: string | null;
  studentCount: number;
  status: string;
}

interface AssignSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (schoolId: string, schoolName: string) => Promise<void>;
  sppgId: string;
  onRegisterNew?: (searchQuery: string) => void;
}

export default function AssignSchoolModal({
  isOpen,
  onClose,
  onAssign,
  sppgId,
  onRegisterNew
}: AssignSchoolModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Search schools with debounce
  useEffect(() => {
    if (!isOpen) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchSchools(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isOpen]);

  const searchSchools = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append('q', query.trim());
      }
      params.append('limit', '50');

      const response = await fetch(
        `/api/cms/served-entities/schools/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mencari sekolah');
      }

      const data = await response.json();
      setSchools(data.schools || []);
    } catch (err) {
      console.error('Error searching schools:', err);
      setError('Gagal mencari sekolah. Silakan coba lagi.');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = async () => {
    if (!selectedSchool) return;

    // Check if already assigned to another SPPG
    if (selectedSchool.sppg_id && selectedSchool.sppg_id !== sppgId) {
      if (!confirm(`Sekolah ini sudah di-assign ke "${selectedSchool.assigned_sppg_name}". Apakah Anda yakin ingin memindahkannya ke SPPG Anda?`)) {
        return;
      }
    }

    setIsAssigning(true);
    setError(null);

    try {
      await onAssign(selectedSchool.id, selectedSchool.name);
      
      // Reset state
      setSelectedSchool(null);
      setSearchQuery('');
      setSchools([]);
      
      // Close modal
      onClose();
    } catch (err: any) {
      console.error('Error assigning school:', err);
      setError(err.message || 'Gagal menambahkan sekolah. Silakan coba lagi.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    if (isAssigning) return;
    
    setSearchQuery('');
    setSchools([]);
    setSelectedSchool(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tambah Sekolah</h2>
              <p className="text-sm text-gray-500">Cari dan pilih sekolah yang akan dilayani</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isAssigning}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <IconX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <IconSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari nama sekolah, kecamatan, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isAssigning}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Search Status */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mencari...</span>
                </div>
              )}
              {!loading && schools.length > 0 && (
                <span className="text-sm text-gray-600">
                  {schools.length} sekolah ditemukan
                </span>
              )}
              {!loading && searchQuery.length > 0 && schools.length === 0 && (
                <span className="text-sm text-gray-500">Tidak ada hasil</span>
              )}
            </div>
            {searchQuery.length > 0 && !loading && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Schools List */}
        <div className="flex-1 overflow-y-auto p-6">
          {schools.length > 0 ? (
            <div className="space-y-2">
              {schools.map((school) => {
                const isSelected = selectedSchool?.id === school.id;
                const isAssignedToOther = school.sppg_id && school.sppg_id !== sppgId;
                const isAssignedToMe = school.sppg_id === sppgId;
                
                return (
                  <button
                    key={school.id}
                    onClick={() => setSelectedSchool(school)}
                    disabled={isAssigning}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isAssignedToMe
                        ? 'border-green-200 bg-green-50 hover:border-green-300'
                        : isAssignedToOther
                        ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isAssignedToMe
                          ? 'bg-green-100'
                          : isAssignedToOther
                          ? 'bg-orange-100'
                          : 'bg-blue-100'
                      }`}>
                        <IconSchool className={`h-5 w-5 ${
                          isAssignedToMe
                            ? 'text-green-600'
                            : isAssignedToOther
                            ? 'text-orange-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 leading-tight">
                            {school.name}
                          </h3>
                          {isSelected && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <IconCheck className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {school.address}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-700 border border-gray-200">
                            <IconMapPin className="h-3 w-3 mr-1" />
                            {school.district}
                          </span>
                          {isAssignedToMe && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 rounded-md text-xs font-semibold text-green-700 border border-green-300">
                              <IconUserCheck className="h-3 w-3 mr-1" />
                              Sudah di SPPG Anda
                            </span>
                          )}
                          {isAssignedToOther && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 rounded-md text-xs font-semibold text-orange-700 border border-orange-300">
                              <IconAlertCircle className="h-3 w-3 mr-1" />
                              {school.assigned_sppg_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : !loading && searchQuery.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSearch className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Mulai Pencarian</p>
              <p className="text-sm text-gray-500 mt-1">
                Ketik nama sekolah untuk mencari
              </p>
            </div>
          ) : !loading && searchQuery.length > 0 && schools.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSchool className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Tidak ada hasil</p>
              <p className="text-sm text-gray-500 mt-1">
                Tidak ada sekolah yang ditemukan untuk &quot;{searchQuery}&quot;
              </p>
              {onRegisterNew && (
                <div className="mt-5 mx-auto max-w-sm p-4 bg-blue-50 border border-blue-200 rounded-xl text-left">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Sekolah belum terdaftar?</p>
                  <p className="text-xs text-blue-700 mb-3">
                    Jika sekolah tidak ditemukan dalam sistem, Anda dapat mendaftarkannya sebagai sekolah baru dan langsung dikaitkan ke SPPG Anda.
                  </p>
                  <button
                    onClick={() => onRegisterNew(searchQuery)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IconPlus className="h-4 w-4" />
                    Daftarkan Sekolah Baru
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between space-x-3">
            <button
              onClick={handleClose}
              disabled={isAssigning}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={handleAssignClick}
              disabled={!selectedSchool || isAssigning}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAssigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menambahkan...</span>
                </>
              ) : (
                <>
                  <IconCheck className="h-5 w-5" />
                  <span>Tambahkan Sekolah</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
