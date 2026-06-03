'use client';

import { IconHeart, IconTarget, IconUsers, IconLeaf } from '@tabler/icons-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative bg-gradient-to-br from-green-50 via-white to-blue-50/30 py-24 px-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg shadow-green-500/30">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            Program Nasional Presiden RI
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Tentang Program
            <span className="block bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Makan Bergizi Gratis
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Program prioritas nasional Pemerintah Indonesia di bawah Presiden Prabowo Subianto untuk memastikan 82,9 juta anak Indonesia 
            mendapat nutrisi berkualitas demi masa depan bangsa yang lebih sehat dan cerdas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-red-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-slide-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-red-500 to-red-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconHeart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">Misi</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Mewujudkan generasi yang sehat, cerdas, dan berkarakter melalui 
                pemenuhan gizi yang optimal di sekolah.
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-blue-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-slide-in-up" style={{animationDelay: '0.1s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconTarget className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Tujuan</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Mengurangi angka stunting, meningkatkan konsentrasi belajar, 
                dan menciptakan kebiasaan makan sehat.
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-green-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-slide-in-up" style={{animationDelay: '0.2s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconUsers className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Sasaran</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Semua siswa di sekolah-sekolah terpilih di Kabupaten Sumedang 
                dengan prioritas daerah yang membutuhkan.
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-yellow-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-slide-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconLeaf className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors">Manfaat</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Meningkatkan asupan gizi, mengurangi beban ekonomi keluarga, 
                dan mendukung pertumbuhan optimal anak.
              </p>
            </div>
          </div>
        </div>

        {/* Program Timeline */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-lg shadow-purple-500/30">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Perjalanan Program
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
              Timeline Program
            </h3>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-300 via-green-300 to-yellow-300"></div>
            
            <div className="space-y-12">
              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="group bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full mb-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-xs font-semibold text-blue-700">Milestone 1</span>
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Uji Coba Pertama</h4>
                    <p className="text-sm font-semibold text-blue-600 mb-3">18 November 2024</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      SDN Sirah Cai dengan teknologi dapur satelit modular
                    </p>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
                </div>
                <div className="w-1/2 pl-8"></div>
              </div>

              <div className="flex items-center">
                <div className="w-1/2 pr-8"></div>
                <div className="relative z-10">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
                </div>
                <div className="w-1/2 pl-8">
                  <div className="group bg-white p-8 rounded-2xl border-2 border-green-100 shadow-lg hover:shadow-2xl hover:border-green-300 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full mb-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-xs font-semibold text-green-700">Milestone 2</span>
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Ekspansi Program</h4>
                    <p className="text-sm font-semibold text-green-600 mb-3">17 Februari 2025</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      4 sekolah di Kecamatan Tanjungsari mulai menerima program
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="group bg-white p-8 rounded-2xl border-2 border-yellow-100 shadow-lg hover:shadow-2xl hover:border-yellow-300 transition-all duration-300">
                    <div className="inline-flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full mb-3">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <span className="text-xs font-semibold text-yellow-700">Target</span>
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">Target 2025</h4>
                    <p className="text-sm font-semibold text-yellow-600 mb-3">Sepanjang Tahun</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Ekspansi ke lebih banyak sekolah di seluruh Kabupaten Sumedang
                    </p>
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full border-4 border-white shadow-xl animate-pulse"></div>
                </div>
                <div className="w-1/2 pl-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
