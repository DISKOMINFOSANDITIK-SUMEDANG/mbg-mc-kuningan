'use client';

import AppLayout from '@/components/shared/AppLayout';
import { IconHeart, IconTarget, IconUsers, IconLeaf, IconAward, IconClock, IconMapPin } from '@tabler/icons-react';

export default function AboutPage() {
  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-green-50/30 to-white py-24 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-green-500/30">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Program Nasional Indonesia
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Tentang Program
              <span className="block bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                Makan Bergizi Gratis
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Program prioritas nasional Pemerintah Indonesia di bawah Presiden Prabowo Subianto yang bertujuan meningkatkan gizi dan kesejahteraan rakyat. 
              Kabupaten Kuningan adalah salah satu daerah pelaksana program dengan target menjangkau 82,9 juta penerima manfaat di seluruh Indonesia.
            </p>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Goals */}
      <section className="relative py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-red-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="group relative bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-red-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-red-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <IconHeart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">Misi</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mewujudkan generasi Indonesia yang sehat, cerdas, dan produktif melalui 
                  pemenuhan gizi berkualitas untuk 82,9 juta penerima manfaat di seluruh Indonesia sebagai investasi masa depan bangsa.
                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="group relative bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <IconTarget className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Visi</h3>
                <p className="text-gray-600 leading-relaxed">
                  Menjadi program prioritas nasional yang sukses meningkatkan kualitas gizi dan kesehatan masyarakat Indonesia, 
                  serta berkontribusi nyata pada pengurangan kemiskinan dan peningkatan produktivitas bangsa.
                </p>
              </div>
            </div>

            {/* Goals */}
            <div className="group relative bg-white rounded-3xl p-10 border-2 border-gray-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <IconLeaf className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Tujuan</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mengurangi angka stunting, meningkatkan konsentrasi belajar, 
                  dan menciptakan kebiasaan makan sehat yang berkelanjutan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-purple-500/30">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Informasi Program
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Detail Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Program Makan Bergizi Gratis merupakan program strategis nasional yang dirancang dengan pendekatan holistik 
              untuk memastikan setiap anak Indonesia mendapat nutrisi optimal. 
              Sejak Januari 2026, program ini telah menjangkau hampir 30 juta penerima manfaat di 38 provinsi, termasuk Kabupaten Kuningan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IconUsers className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Sasaran</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Siswa-siswi PAUD hingga SMA/SMK serta ibu hamil dan menyusui di seluruh Indonesia, 
                  dengan alokasi anggaran sebesar Rp171 triliun.
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-green-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IconAward className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Kualitas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Menu bergizi seimbang yang disusun oleh ahli gizi profesional 
                  sesuai standar kesehatan nasional.
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IconClock className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">Kontinuitas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Program berjalan setiap hari sekolah dengan dukungan 
                  infrastruktur yang memadai dan berkelanjutan.
                </p>
              </div>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-orange-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                  <IconMapPin className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Jangkauan</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Melayani 38 provinsi di Indonesia melalui 30.000 SPPG (Satuan Pelayanan Pemenuhan Gizi) 
                  dengan sistem distribusi yang efisien dan terkoordinasi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* National Statistics */}
      <section className="relative py-24 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-blue-500/30">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Data Nasional
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pencapaian Nasional
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dalam 11 bulan pelaksanaan, Program MBG telah mencapai capaian signifikan 
              dengan dampak positif bagi kesejahteraan dan pertumbuhan ekonomi rakyat hingga tingkat desa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl p-8 border-2 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">25 Juta</div>
              <p className="text-gray-600 font-medium">Penerima Manfaat<br/><span className="text-sm text-gray-500">(September 2026)</span></p>
            </div>
            <div className="group bg-white rounded-2xl p-8 border-2 border-green-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent mb-3">5.905</div>
              <p className="text-gray-600 font-medium">SPPG Beroperasi</p>
            </div>
            <div className="group bg-white rounded-2xl p-8 border-2 border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent mb-3">38</div>
              <p className="text-gray-600 font-medium">Provinsi Terjangkau</p>
            </div>
            <div className="group bg-white rounded-2xl p-8 border-2 border-orange-100 hover:border-orange-300 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-br from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">Rp171T</div>
              <p className="text-gray-600 font-medium">Alokasi Anggaran</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kuningan Implementation */}
      <section className="relative py-24 bg-gradient-to-br from-green-50/50 via-white to-blue-50/30 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-green-500/30">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Kabupaten Kuningan
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Implementasi di Kabupaten Kuningan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sebagai salah satu daerah pelaksana Program Nasional Makan Bergizi Gratis, 
              Kabupaten Kuningan berkomitmen penuh mendukung program Presiden dengan memberikan pelayanan terbaik 
              dalam pemenuhan gizi anak sekolah sesuai standar nasional.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="bg-white rounded-3xl p-10 border-2 border-green-100 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <IconLeaf className="h-5 w-5 text-white" />
                </div>
                Komitmen Kabupaten Kuningan
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconLeaf className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">Menerapkan standar kualitas menu sesuai pedoman nasional</p>
                </li>
                <li className="flex items-start group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconLeaf className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">Mengoptimalkan sistem distribusi melalui SPPG lokal</p>
                </li>
                <li className="flex items-start group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconLeaf className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">Melakukan monitoring dan evaluasi berkelanjutan</p>
                </li>
                <li className="flex items-start group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IconLeaf className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">Mengintegrasikan program dengan sistem pendidikan lokal</p>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-3xl p-10 border-2 border-blue-100 shadow-xl">
              <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <IconTarget className="h-5 w-5 text-white" />
                </div>
                Target Kabupaten Kuningan
              </h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-300">
                  <span className="text-gray-700 font-medium">Sekolah Terjangkau</span>
                  <span className="font-bold text-2xl bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">100+</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors duration-300">
                  <span className="text-gray-700 font-medium">Siswa Dijangkau</span>
                  <span className="font-bold text-2xl bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">50,000+</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors duration-300">
                  <span className="text-gray-700 font-medium">SPPG Lokal</span>
                  <span className="font-bold text-2xl bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">15+</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors duration-300">
                  <span className="text-gray-700 font-medium">Kecamatan</span>
                  <span className="font-bold text-2xl bg-gradient-to-br from-orange-600 to-orange-700 bg-clip-text text-transparent">26</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
