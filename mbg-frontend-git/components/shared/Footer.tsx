"use client";

import { IconMapPin, IconMail, IconBrandInstagram, IconBrandFacebook, IconBrandTwitter, IconBrandWhatsapp } from '@tabler/icons-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Makan Bergizi Gratis</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Program prioritas nasional Pemerintah Indonesia untuk memastikan 
              anak-anak mendapat nutrisi berkualitas. Implementasi di Kabupaten Kuningan.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <IconBrandFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <IconBrandInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <IconBrandTwitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-300 hover:text-white transition-colors">
                  Beranda
                </a>
              </li>
              <li>
                <a href="/search" className="text-gray-300 hover:text-white transition-colors">
                  Sekolah
                </a>
              </li>
              <li>
                <a href="/groups" className="text-gray-300 hover:text-white transition-colors">
                  Kelompok
                </a>
              </li>
              <li>
                <a href="/sppg-search" className="text-gray-300 hover:text-white transition-colors">
                  SPPG
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-300 hover:text-white transition-colors">
                  Tentang Program
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Kontak/Pengaduan
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontak</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <IconMapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-300 text-sm">
                  Dinas Komunikasi dan Informatika, Jl. Aruji Kartawinata No.15, Kec. Kuningan, Kabupaten Kuningan, Jawa Barat 45511
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center space-x-3">
                <IconBrandWhatsapp className="h-5 w-5 text-gray-400" />
                <p className="text-gray-300 text-sm">085182245865 (WhatsApp)</p>
              </div> */}
              <div className="flex items-center space-x-3">
                <IconMail className="h-5 w-5 text-gray-400" />
                <p className="text-gray-300 text-sm">diskominfo@kuningankab.go.id</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Pemerintah Kabupaten Kuningan. Semua hak dilindungi.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy_policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Kebijakan Privasi
              </a>
            </div>
            {/* <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Syarat & Ketentuan
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
