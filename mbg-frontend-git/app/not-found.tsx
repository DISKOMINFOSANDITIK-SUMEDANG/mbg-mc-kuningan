import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-8">
            Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Beranda
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Atau coba:</p>
            <div className="mt-2 space-x-4">
              <Link href="/search" className="text-blue-600 hover:underline">
                Cari Sekolah
              </Link>
              <Link href="/sppg-search" className="text-blue-600 hover:underline">
                Cari SPPG
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}