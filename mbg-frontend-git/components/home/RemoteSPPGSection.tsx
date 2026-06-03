"use client";

import { useState } from "react";

export default function RemoteSPPGSection() {
  const [showAll, setShowAll] = useState(false);
  
  // Data SPPG Terpencil sesuai gambar
  const remoteSPPGData = [
    { no: 1, kecamatan: "Surian", lokasi: "Tanjung, Suriamukti, Wanajaya" },
    { no: 2, kecamatan: "Cisitu", lokasi: "Cimarga, Cikeusi Cinangsi" },
    { no: 3, kecamatan: "Situraja", lokasi: "Bangbayang, Cicarimanah" },
    { no: 4, kecamatan: "Cibugel", lokasi: "Cipasang, Tamansari" },
    { no: 5, kecamatan: "Tanjungmedar", lokasi: "Kamal, Kertamukti, Cisangge Tanjungmekar" },
    { no: 6, kecamatan: "Buahdua", lokasi: "Ciawitali, Karangbungur" },
    { no: 7, kecamatan: "Wado", lokasi: "Cimungkal" },
    { no: 8, kecamatan: "Jatigede", lokasi: "Karedok, Cintajaya, Kadu" },
    { no: 9, kecamatan: "Jatinunggal", lokasi: "Cimanitin" },
    { no: 10, kecamatan: "Darmaraja", lokasi: "Cipeuteuy, Pakualam" },
    { no: 11, kecamatan: "Pamulihan", lokasi: "Cinanggerang" },
    { no: 12, kecamatan: "Conggeang", lokasi: "Ungkal, Babakan Asem, Padaasih" },
    { no: 13, kecamatan: "Sukasari", lokasi: "Genteng" },
    { no: 14, kecamatan: "Cimanggung", lokasi: "Sindulang" },
    { no: 15, kecamatan: "Tanjungsari", lokasi: "Cijambu" },
  ];

  const displayedData = showAll ? remoteSPPGData : remoteSPPGData.slice(0, 10);

  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-100/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-xs font-semibold mb-4 sm:mb-5 shadow-lg shadow-purple-500/30">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            <span>Program Khusus</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4 tracking-tight px-4">
            SPPG Terpencil
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Program khusus untuk wilayah terpencil di Kabupaten Sumedang yang memerlukan perhatian lebih dalam pembangunan infrastruktur SPPG
          </p>
        </div>

        {/* Main Stats Card */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden mb-6 sm:mb-8 lg:mb-12">
          <div className="p-5 sm:p-6 lg:p-8 xl:p-10">
            {/* Header Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
              {/* Total SPPG */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-2 tracking-tight">
                  28
                </div>
                <div className="text-white/90 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Total SPPG
                </div>
              </div>

              {/* Selesai Pembangunan */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight">
                    28
                  </div>
                </div>
                <div className="text-white/90 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Selesai Pembangunan
                </div>
              </div>

              {/* Proses Pembangunan */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight">
                    0
                  </div>
                </div>
                <div className="text-white/90 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                  Proses Pembangunan
                </div>
              </div>
            </div>

            {/* Status Notice Banner */}
            <div className="mb-4 sm:mb-6 bg-white/10 backdrop-blur-sm border border-yellow-300/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400/30 border border-yellow-300/40 rounded-lg sm:rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse flex-shrink-0"></span>
                  <span className="text-yellow-200 font-bold text-sm sm:text-base">Belum Running</span>
                </div>
                <p className="text-white/60 text-xs sm:text-sm font-medium">Menunggu proses selesai di BGN</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between text-white/90 text-xs sm:text-sm font-medium mb-2">
                <span>Progress Pembangunan</span>
                <span>100% (28/28)</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 sm:h-4 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-300 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out shadow-lg flex items-center justify-end pr-1 sm:pr-2"
                  style={{ width: "100%" }}
                >
                  <span className="text-xs font-bold text-white hidden sm:inline">100%</span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 mt-0.5 sm:mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <div className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1">Maksimal 1.000 penerima manfaat</div>
                    <div className="text-white/80 text-xs sm:text-sm">Target penerima manfaat per SPPG</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 mt-0.5 sm:mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1">Maksimal pembangunan 35 hari</div>
                    <div className="text-white/80 text-xs sm:text-sm">Target waktu penyelesaian pembangunan</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Distribution Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Sebaran Lokasi SPPG Terpencil
            </h3>
            <p className="text-gray-600 mt-2 text-xs sm:text-sm">15 kecamatan dengan total 28 lokasi SPPG</p>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden p-4 space-y-4">
            {displayedData.map((item) => (
              <div key={item.no} className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                    {item.no}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {item.kecamatan}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      {item.lokasi}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button - Only on Mobile */}
            {!showAll && remoteSPPGData.length > 10 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Muat Lebih Banyak</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            
            {showAll && remoteSPPGData.length > 10 && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Tampilkan Lebih Sedikit</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-100 to-indigo-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20 border-b-2 border-purple-300">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-64 border-b-2 border-purple-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Kecamatan
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-purple-300">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Lokasi/Desa
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {remoteSPPGData.map((item, index) => (
                    <tr 
                      key={item.no} 
                      className={`hover:bg-purple-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white font-bold shadow-md">
                          {item.no}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-base">
                          {item.kecamatan}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {item.lokasi}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Summary */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Total: <span className="font-bold text-gray-900">15 Kecamatan</span> dengan <span className="font-bold text-gray-900">28 Lokasi SPPG</span></span>
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-semibold text-purple-900">Program Khusus Wilayah Terpencil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
