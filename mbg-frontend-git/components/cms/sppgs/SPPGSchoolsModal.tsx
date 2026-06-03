'use client';

import { useState, useEffect } from 'react';
import { 
  IconX, 
  IconSchool, 
  IconMapPin,
  IconUsers,
  IconLoader
} from '@tabler/icons-react';
import { buildApiUrl, API_ENDPOINTS } from '@/lib/api-utils';

interface School {
  id: string;
  name: string;
  level: string;
  address: string;
  district: string;
  village: string;
  student_count: number;
  status: string;
}

interface SPPGSchoolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sppgId: string;
  sppgName: string;
}

export default function SPPGSchoolsModal({
  isOpen,
  onClose,
  sppgId,
  sppgName
}: SPPGSchoolsModalProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sppgId) {
      loadSchools();
    }
  }, [isOpen, sppgId]);

  const loadSchools = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.CMS_SPPGS}/${sppgId}/schools`), {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSchools(Array.isArray(data) ? data : (data.schools || []));
    } catch (err: any) {
      console.error('Error loading schools:', err);
      setError(err.message || 'Gagal memuat data sekolah');
    } finally {
      setLoading(false);
    }
  };

  const getTotalBeneficiaries = () => {
    return schools.reduce((sum, school) => sum + (school.student_count || 0), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pilot':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconSchool className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Daftar Sekolah</h2>
              <p className="text-sm text-gray-500">{sppgName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconX className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        {!loading && schools.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconSchool className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Sekolah</p>
                    <p className="text-xl font-bold text-gray-900">{schools.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <IconUsers className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Penerima Manfaat</p>
                    <p className="text-xl font-bold text-gray-900">{getTotalBeneficiaries().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schools List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <IconLoader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Memuat data sekolah...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={loadSchools}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : schools.length > 0 ? (
            <div className="space-y-3">
              {schools.map((school, index) => (
                <div
                  key={school.id}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {school.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(school.status)}`}>
                          {school.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {school.address}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700">
                          {school.level}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 rounded-md text-xs font-medium text-blue-700">
                          <IconMapPin className="h-3 w-3 mr-1" />
                          {school.district}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 bg-green-50 rounded-md text-xs font-semibold text-green-700">
                          <IconUsers className="h-3 w-3 mr-1" />
                          {(school.student_count || 0).toLocaleString()} siswa
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSchool className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Belum ada sekolah</p>
              <p className="text-sm text-gray-500 mt-1">
                SPPG ini belum melayani sekolah manapun
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
