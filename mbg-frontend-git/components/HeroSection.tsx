hp'use client';

import { useState } from 'react';
import { IconSearch, IconMapPin, IconUsers, IconCalendar } from '@tabler/icons-react';
import { searchSchools, School } from '@/lib/data';

interface HeroSectionProps {
  onSchoolSelect: (school: School) => void;
}

export default function HeroSection({ onSchoolSelect }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchSchools(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    onSchoolSelect(school);
    setSearchQuery(school.name);
    setShowResults(false);
  };

  return (
    <section id="home" className="relative min-h-screen bg-blue-50 flex items-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
            Program Prioritas Nasional - Kabupaten Sumedang
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Makan Bergizi
            <span className="block text-blue-600">
              Gratis
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Program Pemerintah Indonesia untuk generasi sehat dan cerdas
            <span className="block text-lg text-gray-500 mt-2">
              Implementasi di Kabupaten Sumedang - Jawa Barat
            </span>
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <IconSearch className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Cari nama sekolah, kecamatan, atau alamat..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl bg-white/80 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto animate-fade-in">
              {searchResults.map((school) => (
                <div
                  key={school.id}
                  onClick={() => handleSchoolSelect(school)}
                  className="p-6 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <IconMapPin className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {school.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {school.address}
                      </p>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <IconUsers className="h-4 w-4 mr-2" />
                          {school.studentCount} siswa
                        </span>
                        <span className="flex items-center">
                          <IconCalendar className="h-4 w-4 mr-2" />
                          {school.district}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
          )}

          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="absolute z-20 w-full mt-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconSearch className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  Tidak ada sekolah yang ditemukan untuk &quot;{searchQuery}&quot;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center group">
            <div className="bg-blue-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <IconUsers className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">5+</h3>
            <p className="text-gray-600 font-medium">Sekolah Terdaftar</p>
            <p className="text-sm text-gray-500 mt-1">Aktif di program</p>
          </div>
          <div className="text-center group">
            <div className="bg-green-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <IconMapPin className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">2</h3>
            <p className="text-gray-600 font-medium">Dapur SPPG Aktif</p>
            <p className="text-sm text-gray-500 mt-1">Siap melayani</p>
          </div>
          <div className="text-center group">
            <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <IconCalendar className="h-10 w-10 text-orange-600" />
            </div>
            <h3 className="text-4xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">1,000+</h3>
            <p className="text-gray-600 font-medium">Porsi per Hari</p>
            <p className="text-sm text-gray-500 mt-1">Nutrisi berkualitas</p>
          </div>
        </div>
      </div>
    </section>
  );
}
