'use client';

import { useState } from 'react';
import { IconMapPin, IconUsers, IconCalendar, IconChefHat, IconTools } from '@tabler/icons-react';
import { School, getSPPGById, getDailyMenuBySPPG } from '@/lib/data';
import SPPGDetail from './SPPGDetail';
import MenuDetail from './MenuDetail';

interface SchoolDetailProps {
  school: School;
}

export default function SchoolDetail({ school }: SchoolDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'sppg' | 'menu'>('info');
  const sppg = getSPPGById(school.sppgId);
  const dailyMenus = getDailyMenuBySPPG(school.sppgId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pilot':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SD':
        return 'bg-blue-100 text-blue-800';
      case 'SMP':
        return 'bg-green-100 text-green-800';
      case 'SMA':
        return 'bg-purple-100 text-purple-800';
      case 'SMK':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* School Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-indigo-600 px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <IconUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{school.name}</h1>
                  <p className="text-indigo-100 text-lg">{school.level} - {school.district}</p>
                </div>
              </div>
              <p className="text-indigo-100">{school.address}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(school.level)}`}>
                {school.level}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(school.status)}`}>
                {school.status}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* School Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <IconUsers className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Jumlah Siswa</h3>
                <p className="text-gray-600">{school.studentCount.toLocaleString()} siswa</p>
              </div>
            </div>
         
            <div className="flex items-center space-x-3">
              <IconMapPin className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">Kecamatan</h3>
                <p className="text-gray-600">{school.district}</p>
              </div>
            </div>
          </div>

          {/* SPPG Preview */}
          {sppg && (
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <IconChefHat className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Dapur Penyedia (SPPG)</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{sppg.name}</h4>
                  <p className="text-sm text-gray-600">{sppg.type} • {(sppg.capacity || 0).toLocaleString()} porsi/hari</p>
                </div>
                <button
                  onClick={() => setActiveTab('sppg')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Informasi Sekolah
            </button>
            <button
              onClick={() => setActiveTab('sppg')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sppg'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detail SPPG
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'menu'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Menu Harian
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <IconMapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">Alamat Lengkap</h4>
                      <p className="text-gray-600">{school.address}</p>
                    </div>
                  </div>
                  {school.coordinates && (
                    <div className="flex items-center space-x-3">
                      <IconMapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900">Koordinat</h4>
                        <p className="text-gray-600">
                          {school.coordinates.lat}, {school.coordinates.lng}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Program</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Program Makan Bergizi Gratis</h4>
                      <p className="text-sm text-gray-600">
                        Aktif sejak {formatDate(school.programStartDate)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(school.status)}`}>
                      {school.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sppg' && sppg && (
            <SPPGDetail sppg={sppg} />
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              {dailyMenus.length > 0 ? (
                dailyMenus.map((dailyMenu) => (
                  <MenuDetail key={dailyMenu.id} dailyMenu={dailyMenu} />
                ))
              ) : (
                <div className="text-center py-12">
                  <IconTools className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Belum Tersedia</h3>
                  <p className="text-gray-600">
                    Menu harian untuk hari ini belum tersedia. Silakan cek kembali nanti.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
