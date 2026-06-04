'use client';

import { IconHeart, IconTarget, IconUsers, IconLeaf } from '@tabler/icons-react';

export default function AboutSection() {
  return (
    <section id="about" className="relative bg-gradient-to-br from-gray-50 via-white to-green-50/30 py-24 px-4 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-green-500/30">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
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
            <div className="relative text-center">
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
            <div className="relative text-center">
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
            <div className="relative text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <IconUsers className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Sasaran</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Semua siswa di sekolah-sekolah terpilih di Kabupaten Kuningan 
                dengan prioritas daerah yang membutuhkan.
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-yellow-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-slide-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative text-center">
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
      </div>
    </section>
  );
}
