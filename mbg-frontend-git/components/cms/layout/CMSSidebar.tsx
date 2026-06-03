'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  IconHome, 
  IconBuilding, 
  IconChefHat, 
  IconUsers, 
  IconClipboardList,
  IconTruck,
  IconUser,
  IconShield,
  IconChartBar,
  IconMapPin,
  IconFileText,
  IconCalendar,
  IconX,
  IconSchool,
  IconUsersGroup,
  IconPackage,
  IconCategory,
  IconApple,
  IconShoppingCart,
  IconReportAnalytics,
  IconBuildingWarehouse,
  IconCash,
  IconFileInvoice,
  IconCurrencyDollar,
  IconArrowDown,
  IconArrowUp,
  IconTargetArrow
} from '@tabler/icons-react';

interface CMSSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userRole?: 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian';
  isLoading?: boolean;
}

export default function CMSSidebar({ sidebarOpen, setSidebarOpen, userRole, isLoading = false }: CMSSidebarProps) {
  const pathname = usePathname();

  // Menu berdasarkan role
  const getMainNavigation = () => {
    const baseMenu = [
      { 
        name: 'Dashboard', 
        href: userRole === 'administrator' ? '/cms/dashboard' : 
              userRole === 'sekolah' ? '/cms/dashboard/sekolah' : 
              userRole === 'sppg' ? '/cms/dashboard/sppg' :
              userRole === 'pemasok' ? '/cms/dashboard/pemasok' :
              userRole === 'offtaker' ? '/cms/dashboard/offtaker' :
              userRole === 'dinas_pertanian' ? '/cms/dashboard/dinas-pertanian' :
              '/cms/dashboard', 
        icon: IconHome, 
        current: pathname === '/cms/dashboard' || pathname === '/cms/dashboard/sekolah' || pathname === '/cms/dashboard/sppg' || pathname === '/cms/dashboard/pemasok' || pathname === '/cms/dashboard/offtaker' || pathname === '/cms/dashboard/dinas-pertanian',
        description: 'Overview sistem'
      }
    ];

    // Show loading state or minimal menu when role is not loaded
    if (isLoading || !userRole) {
      return baseMenu;
    }

    if (userRole === 'administrator') {
      return [
        ...baseMenu,
        { 
          name: 'Sekolah', 
          href: '/cms/schools', 
          icon: IconBuilding, 
          current: pathname === '/cms/schools',
          description: 'Kelola data sekolah'
        },
        { 
          name: 'Kelompok', 
          href: '/cms/groups', 
          icon: IconUsers, 
          current: pathname === '/cms/groups',
          description: 'Kelola kelompok masyarakat'
        },
        { 
          name: 'SPPG', 
          href: '/cms/sppgs', 
          icon: IconChefHat, 
          current: pathname === '/cms/sppgs',
          description: 'Kelola dapur penyedia'
        }
      ];
    } else if (userRole === 'sppg') {
      return [
        ...baseMenu,
        { 
          name: 'Kelola SPPG Saya', 
          href: '/cms/sppg-management', 
          icon: IconChefHat, 
          current: pathname.startsWith('/cms/sppg-management'),
          description: 'Kelola data SPPG Anda'
        },
        { 
          name: 'Entitas Dilayani', 
          href: '/cms/served-entities', 
          icon: IconUsersGroup, 
          current: pathname === '/cms/served-entities',
          description: 'Lihat sekolah dan kelompok yang dilayani'
        },
        { 
          name: 'Katalog Produk', 
          href: '/sppg/products', 
          icon: IconShoppingCart, 
          current: pathname === '/sppg/products',
          description: 'Browse produk dari offtaker'
        },
      ];
    } else if (userRole === 'sekolah') {
      return [
        ...baseMenu,
        { 
          name: 'Kelola Sekolah Saya', 
          href: '/cms/school-management', 
          icon: IconSchool, 
          current: pathname.startsWith('/cms/school-management'),
          description: 'Kelola data sekolah Anda'
        }
      ];
    } else if (userRole === 'pemasok') {
      return baseMenu;
    } else if (userRole === 'offtaker') {
      return baseMenu;
    } else if (userRole === 'dinas_pertanian') {
      return [
        ...baseMenu,
        { 
          name: 'Sekolah', 
          href: '/cms/schools', 
          icon: IconBuilding, 
          current: pathname === '/cms/schools',
          description: 'Kelola data sekolah'
        },
        { 
          name: 'Kelompok', 
          href: '/cms/groups', 
          icon: IconUsers, 
          current: pathname === '/cms/groups',
          description: 'Kelola kelompok masyarakat'
        },
        { 
          name: 'SPPG', 
          href: '/cms/sppgs', 
          icon: IconChefHat, 
          current: pathname === '/cms/sppgs',
          description: 'Kelola dapur penyedia'
        }
      ];
    }

    return baseMenu;
  };

  const mainNavigation = getMainNavigation();

  // Menu khusus Pemasok - Manajemen Pemasok
  const getSupplierManagement = () => {
    if (isLoading || !userRole) {
      return [];
    }

    if (userRole === 'administrator') {
      return [
        { 
          name: 'Pemasok', 
          href: '/cms/suppliers', 
          icon: IconTruck, 
          current: pathname.startsWith('/cms/suppliers'),
          description: 'Kelola data pemasok'
        },
        { 
          name: 'Kategori Komoditas', 
          href: '/cms/commodity-categories', 
          icon: IconCategory, 
          current: pathname.startsWith('/cms/commodity-categories'),
          description: 'Kelola kategori komoditas'
        },
        { 
          name: 'Produk', 
          href: '/cms/products', 
          icon: IconPackage, 
          current: pathname === '/cms/products' || (pathname.startsWith('/cms/products/') && !pathname.includes('supplier-products')),
          description: 'Kelola produk komoditas'
        },
        { 
          name: 'Laporan Stok', 
          href: '/cms/reports/stock', 
          icon: IconReportAnalytics, 
          current: pathname.startsWith('/cms/reports/stock'),
          description: 'Laporan dan manajemen stok produk'
        }
      ];
    } else if (userRole === 'pemasok') {
      return [
        { 
          name: 'Profil Pemasok', 
          href: '/cms/supplier-profile', 
          icon: IconTruck, 
          current: pathname.startsWith('/cms/supplier-profile'),
          description: 'Kelola profil pemasok Anda'
        },
        { 
          name: 'Produk Saya', 
          href: '/cms/products', 
          icon: IconPackage, 
          current: pathname === '/cms/products' || (pathname.startsWith('/cms/products/') && !pathname.includes('supplier-products') && !pathname.includes('/stock/')),
          description: 'Kelola produk komoditas'
        },
        { 
          name: 'Stok Masuk', 
          href: '/cms/stock/movements/in', 
          icon: IconArrowUp, 
          current: pathname.startsWith('/cms/stock/movements/in'),
          description: 'Catat dan kelola stok masuk'
        },
        { 
          name: 'Stok Keluar', 
          href: '/cms/stock/movements/out', 
          icon: IconArrowDown, 
          current: pathname.startsWith('/cms/stock/movements/out'),
          description: 'Catat dan kelola stok keluar'
        },
        { 
          name: 'Laporan Stok', 
          href: '/cms/reports/stock', 
          icon: IconReportAnalytics, 
          current: pathname.startsWith('/cms/reports/stock'),
          description: 'Laporan dan riwayat stok produk'
        }
      ];
    } else if (userRole === 'dinas_pertanian') {
      return [
        { 
          name: 'Pemasok', 
          href: '/cms/suppliers', 
          icon: IconTruck, 
          current: pathname.startsWith('/cms/suppliers'),
          description: 'Kelola semua data pemasok'
        },
        { 
          name: 'Produk Pemasok', 
          href: '/cms/products', 
          icon: IconPackage, 
          current: pathname === '/cms/products' || (pathname.startsWith('/cms/products/') && !pathname.includes('supplier-products') && !pathname.includes('/stock/')),
          description: 'Kelola produk semua pemasok'
        },
        { 
          name: 'Stok Masuk', 
          href: '/cms/stock/movements/in', 
          icon: IconArrowUp, 
          current: pathname.startsWith('/cms/stock/movements/in'),
          description: 'Catat dan kelola stok masuk'
        },
        { 
          name: 'Stok Keluar', 
          href: '/cms/stock/movements/out', 
          icon: IconArrowDown, 
          current: pathname.startsWith('/cms/stock/movements/out'),
          description: 'Catat dan kelola stok keluar'
        },
        { 
          name: 'Laporan Stok', 
          href: '/cms/reports/stock', 
          icon: IconReportAnalytics, 
          current: pathname.startsWith('/cms/reports/stock'),
          description: 'Laporan dan riwayat stok produk'
        }
      ];
    }
    return [];
  };

  const supplierManagement = getSupplierManagement();

  // Menu khusus Offtaker - Manajemen Distribusi
  const getOfftakerManagement = () => {
    if (isLoading || !userRole) {
      return [];
    }

    if (userRole === 'administrator') {
      return [
        { 
          name: 'Offtaker', 
          href: '/cms/offtakers', 
          icon: IconBuildingWarehouse, 
          current: pathname.startsWith('/cms/offtakers'),
          description: 'Kelola data offtaker'
        },
        { 
          name: 'Ref. Biaya Tambahan', 
          href: '/cms/settings/additional-costs', 
          icon: IconCurrencyDollar, 
          current: pathname.startsWith('/cms/settings/additional-costs'),
          description: 'Kelola referensi biaya tambahan'
        },
        { 
          name: 'Katalog Produk Pemasok', 
          href: '/cms/offtaker-products', 
          icon: IconPackage, 
          current: pathname.startsWith('/cms/offtaker-products'),
          description: 'Tambahkan produk pemasok & tentukan harga jual'
        },
        { 
          name: 'Penjualan ke SPPG', 
          href: '/cms/transactions/sales', 
          icon: IconCash, 
          current: pathname.startsWith('/cms/transactions/sales'),
          description: 'Transaksi penjualan ke SPPG'
        },
        { 
          name: 'Riwayat Penjualan', 
          href: '/cms/transactions', 
          icon: IconFileInvoice, 
          current: pathname === '/cms/transactions',
          description: 'Histori penjualan ke SPPG'
        },
        { 
          name: 'Laporan Penjualan', 
          href: '/cms/reports/sales', 
          icon: IconReportAnalytics, 
          current: pathname.startsWith('/cms/reports/sales'),
          description: 'Laporan penjualan dan pendapatan'
        }
      ];
    } else if (userRole === 'offtaker') {
      return [
        { 
          name: 'Profil Offtaker', 
          href: '/cms/offtaker-profile', 
          icon: IconBuildingWarehouse, 
          current: pathname.startsWith('/cms/offtaker-profile'),
          description: 'Kelola profil offtaker Anda'
        },
        { 
          name: 'Ref. Biaya Tambahan', 
          href: '/cms/settings/additional-costs', 
          icon: IconCurrencyDollar, 
          current: pathname.startsWith('/cms/settings/additional-costs'),
          description: 'Kelola referensi biaya tambahan'
        },
        { 
          name: 'Katalog Produk Pemasok', 
          href: '/cms/offtaker-products', 
          icon: IconPackage, 
          current: pathname.startsWith('/cms/offtaker-products'),
          description: 'Tambahkan produk pemasok & tentukan harga jual'
        },
        { 
          name: 'Request Produk', 
          href: '/offtaker/product-requests', 
          icon: IconClipboardList, 
          current: pathname.startsWith('/offtaker/product-requests'),
          description: 'Request produk dari SPPG'
        },
        { 
          name: 'Penjualan ke SPPG', 
          href: '/cms/transactions/sales', 
          icon: IconCash, 
          current: pathname.startsWith('/cms/transactions/sales'),
          description: 'Transaksi penjualan ke SPPG'
        },
        // { 
        //   name: 'Riwayat Penjualan', 
        //   href: '/cms/transactions', 
        //   icon: IconFileInvoice, 
        //   current: pathname === '/cms/transactions',
        //   description: 'Histori penjualan ke SPPG'
        // },
        { 
          name: 'Laporan Penjualan', 
          href: '/cms/reports/sales', 
          icon: IconReportAnalytics, 
          current: pathname.startsWith('/cms/reports/sales'),
          description: 'Laporan penjualan dan pendapatan'
        }
        
      ];
    }
    return [];
  };

  const offtakerManagement = getOfftakerManagement();

  // Menu Katalog SPPG untuk Dinas Pertanian
  const getSppgCatalog = () => {
    if (isLoading || !userRole) {
      return [];
    }

    if (userRole === 'dinas_pertanian') {
      return [
        { 
          name: 'Katalog Produk', 
          href: '/sppg/products', 
          icon: IconShoppingCart, 
          current: pathname === '/sppg/products',
          description: 'Browse produk dari offtaker'
        }
      ];
    }
    return [];
  };

  const sppgCatalog = getSppgCatalog();

  // Menu manajemen menu dan distribusi berdasarkan role
  const getMenuManagement = () => {
    // Show empty menu when loading or role not available
    if (isLoading || !userRole) {
      return [];
    }

    if (userRole === 'administrator') {
      return [
         { 
          name: 'Item Menu', 
          href: '/cms/menu-items', 
          icon: IconFileText, 
          current: pathname === '/cms/menu-items',
          description: 'Kelola item menu individual'
        },
        { 
          name: 'Menu', 
          href: '/cms/menus', 
          icon: IconClipboardList, 
          current: pathname === '/cms/menus',
          description: 'Kelola menu makanan dan item menu'
        },
        { 
          name: 'Distribusi', 
          href: '/cms/distributions', 
          icon: IconTruck, 
          current: pathname === '/cms/distributions',
          description: 'Kelola distribusi harian'
        }
      ];
    } else if (userRole === 'sppg') {
      return [
          { 
          name: 'Item Menu', 
          href: '/cms/menu-items', 
          icon: IconFileText, 
          current: pathname === '/cms/menu-items',
          description: 'Kelola item menu SPPG'
        },
        { 
          name: 'Menu', 
          href: '/cms/menus', 
          icon: IconClipboardList, 
          current: pathname === '/cms/menus',
          description: 'Kelola menu makanan SPPG'
        },
        { 
          name: 'Distribusi', 
          href: '/cms/distributions', 
          icon: IconTruck, 
          current: pathname === '/cms/distributions',
          description: 'Kelola distribusi SPPG'
        }
      ];
    } else if (userRole === 'sekolah') {
      return [
        { 
          name: 'Distribusi', 
          href: '/cms/distributions', 
          icon: IconTruck, 
          current: pathname === '/cms/distributions',
          description: 'Lihat distribusi sekolah'
        }
      ];
    }
    return [];
  };

  const menuManagement = getMenuManagement();

  // Menu master data untuk administrator
  const getMasterDataMenu = () => {
    if (isLoading || !userRole) {
      return [];
    }

    // Master data menu sudah dipindahkan ke supplierManagement untuk admin dan pemasok
    return [];
  };

  const masterDataMenu = getMasterDataMenu();

  // Menu manajemen pengguna dan sistem berdasarkan role
  const getSystemManagement = () => {
    // Show empty menu when loading or role not available
    if (isLoading || !userRole) {
      return [];
    }

    if (userRole === 'administrator') {
      return [
        { 
          name: 'Pengguna', 
          href: '/cms/users', 
          icon: IconUser, 
          current: pathname === '/cms/users',
          description: 'Kelola akun pengguna'
        },
        { 
          name: 'Yayasan', 
          href: '/cms/foundations', 
          icon: IconBuilding, 
          current: pathname === '/cms/foundations',
          description: 'Kelola data yayasan'
        },
        { 
          name: 'Target Penerima Manfaat', 
          href: '/cms/settings/beneficiary-targets', 
          icon: IconTargetArrow, 
          current: pathname.startsWith('/cms/settings/beneficiary-targets'),
          description: 'Kelola data target penerima manfaat di halaman utama'
        },
        { 
          name: 'Manajemen File', 
          href: '/cms/files', 
          icon: IconFileText, 
          current: pathname === '/cms/files',
          description: 'Kelola file upload'
        }
      ];
    }
    return [];
  };

  const systemManagement = getSystemManagement();

  // Menu laporan dan analisis berdasarkan role
  // const getReportsAndAnalytics = () => {
  //   // Show empty menu when loading or role not available
  //   if (isLoading || !userRole) {
  //     return [];
  //   }

  //   if (userRole === 'administrator') {
  //     return [
  //       { 
  //         name: 'Laporan', 
  //         href: '/cms/reports', 
  //         icon: IconChartBar, 
  //         current: pathname === '/cms/reports',
  //         description: 'Laporan dan analisis'
  //       },
  //       { 
  //         name: 'Peta', 
  //         href: '/cms/maps', 
  //         icon: IconMapPin, 
  //         current: pathname === '/cms/maps',
  //         description: 'Visualisasi geografis'
  //       },
  //       { 
  //         name: 'Kalender', 
  //         href: '/cms/calendar', 
  //         icon: IconCalendar, 
  //         current: pathname === '/cms/calendar',
  //         description: 'Jadwal dan timeline'
  //       }
  //     ];
  //   }
  //   return [];
  // };

  // const reportsAndAnalytics = getReportsAndAnalytics();

  const NavigationSection = ({ title, items }: { title: string; items: any[] }) => (
    <div className="mb-6">
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={item.description}
            >
              <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <span className="flex-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  const LoadingSection = () => (
    <div className="mb-6">
      <div className="px-3 mb-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <nav className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center px-3 py-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mr-3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-80 h-full flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-gray-900">MBG CMS</h1>
              <p className="text-xs text-gray-500">Content Management System</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3">
              {isLoading ? (
                <>
                  <LoadingSection />
                  <LoadingSection />
                </>
              ) : (
                <>
                  <NavigationSection title="Utama" items={mainNavigation} />
                  {supplierManagement.length > 0 && (
                    <NavigationSection title="Manajemen Pemasok" items={supplierManagement} />
                  )}
                  {offtakerManagement.length > 0 && (
                    <NavigationSection title="Manajemen Distribusi" items={offtakerManagement} />
                  )}
                  {sppgCatalog.length > 0 && (
                    <NavigationSection title="Katalog SPPG" items={sppgCatalog} />
                  )}
                  {menuManagement.length > 0 && (
                    <NavigationSection title="Menu & Distribusi" items={menuManagement} />
                  )}
                  {masterDataMenu.length > 0 && (
                    <NavigationSection title="Master Data" items={masterDataMenu} />
                  )}
                  {systemManagement.length > 0 && (
                    <NavigationSection title="Sistem" items={systemManagement} />
                  )}
                  {/* {reportsAndAnalytics.length > 0 && (
                    <NavigationSection title="Laporan" items={reportsAndAnalytics} />
                  )} */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-gray-900">MBG CMS</h1>
              <p className="text-xs text-gray-500">Content Management System</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4 min-h-0">
            <div className="px-3">
              {isLoading ? (
                <>
                  <LoadingSection />
                  <LoadingSection />
                </>
              ) : (
                <>
                  <NavigationSection title="Utama" items={mainNavigation} />
                  {supplierManagement.length > 0 && (
                    <NavigationSection title="Manajemen Pemasok" items={supplierManagement} />
                  )}
                  {offtakerManagement.length > 0 && (
                    <NavigationSection title="Manajemen Distribusi" items={offtakerManagement} />
                  )}
                  {sppgCatalog.length > 0 && (
                    <NavigationSection title="Katalog SPPG" items={sppgCatalog} />
                  )}
                  {menuManagement.length > 0 && (
                    <NavigationSection title="Menu & Distribusi" items={menuManagement} />
                  )}
                  {masterDataMenu.length > 0 && (
                    <NavigationSection title="Master Data" items={masterDataMenu} />
                  )}
                  {systemManagement.length > 0 && (
                    <NavigationSection title="Sistem" items={systemManagement} />
                  )}
                  {/* {reportsAndAnalytics.length > 0 && (
                    <NavigationSection title="Laporan" items={reportsAndAnalytics} />
                  )} */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
