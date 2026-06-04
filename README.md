# MBG Kabupaten Kuningan

Aplikasi **Makan Bergizi Gratis (MBG) Kabupaten Kuningan** adalah sistem informasi untuk membantu pengelolaan program makan bergizi gratis, mulai dari data sekolah, SPPG, kelompok penerima, pemasok, bahan baku, menu, distribusi, sampai pelaporan.

Aplikasi ini terdiri dari halaman publik untuk informasi program dan CMS untuk pengelolaan data oleh admin/operator.

## Tujuan Aplikasi

- Menyediakan informasi program MBG Kabupaten Kuningan secara mudah diakses.
- Mengelola data sekolah, SPPG, kelompok, dan penerima manfaat.
- Mengelola data pemasok, komoditas, bahan baku, dan stok.
- Membantu pencatatan menu, distribusi, dan laporan kegiatan.
- Menyediakan manajemen file untuk foto dapur, foto ahli gizi, dan dokumen pendukung.

## Fitur Utama

### Halaman Publik

- Beranda informasi program MBG.
- Daftar sekolah dan detail sekolah.
- Daftar kelompok dan detail kelompok.
- Informasi SPPG.
- Data bahan baku dan distribusi.
- Halaman tentang program dan kontak/pengaduan.

### CMS / Admin Panel

- Dashboard ringkasan program.
- Manajemen sekolah.
- Manajemen kelompok.
- Manajemen SPPG.
- Manajemen pemasok dan produk.
- Manajemen offtaker dan transaksi distribusi.
- Manajemen menu dan item menu.
- Manajemen distribusi.
- Manajemen pengguna.
- Manajemen file upload.
- Laporan stok dan laporan penjualan.

## Role Pengguna

Aplikasi mendukung beberapa jenis pengguna, antara lain:

- **Administrator**: mengelola seluruh data dan konfigurasi sistem.
- **Sekolah**: mengakses data dan laporan terkait sekolah.
- **SPPG**: mengelola informasi dapur, distribusi, dan kebutuhan operasional.
- **Pemasok**: mengelola produk/bahan baku yang tersedia.
- **Offtaker**: mengelola katalog produk dan transaksi distribusi.
- **Group/Kelompok**: melihat dan mengelola data kelompok terkait.

## Akun Admin Default

```text
Email    : admin@mbg.local
Password : admin123456
```

## Akses Aplikasi

Jika aplikasi berjalan secara lokal:

- Aplikasi utama: <http://localhost>
- Login CMS: <http://localhost/cms/auth/login>

## Folder Aktif

Source aplikasi aktif berada di:

- `mbg-frontend-git` untuk frontend.
- `mbg-backend-git` untuk backend.

Folder lama berikut diabaikan dari Git karena hanya salinan/arsip lokal:

- `mbg-frontend`
- `mbg-backend`

## Manajemen File

Menu **Manajemen File** digunakan untuk menyimpan file pendukung program, seperti:

- Foto dapur.
- Foto ahli gizi.
- Sertifikat SLHS.
- Dokumen pendukung lain sesuai kebutuhan operasional.

Upload gambar sudah diuji dan file berhasil tampil di halaman CMS.

## Status Terakhir

- Login admin berhasil.
- Halaman dashboard CMS dapat diakses.
- Upload gambar sample berhasil.
- File hasil upload tampil di menu **Manajemen File**.
