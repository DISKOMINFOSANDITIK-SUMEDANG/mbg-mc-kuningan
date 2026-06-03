// Data structure for Makan Bergizi Gratis program in Sumedang

export interface Menu {
  id: string;
  name: string;
  description: string;
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens: string[];
  image?: string;
}

export interface SPPG {
  id: string;
  id_sppg?: string;
  name: string;
  type: 'Dapur Satelit Modular' | 'Dapur Konvensional' | 'Dapur Pusat';
  capacity: number; // max porsi per hari
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  facilities: string[];
  operatingHours: {
    start: string;
    end: string;
  };
  schools: string[]; // school IDs
  kitchenPhoto: string; // Foto dapur
  nutritionist: {
    name: string;
    qualification: string;
    experience: string;
    photo: string;
  };
  slhsCertificate: {
    fileUrl: string;
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
  };
}

export interface School {
  id: string;
  name: string;
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  address: string;
  district: string;
  village: string;
  sppgId: string;
  studentCount: number;
  programStartDate: string;
  status: 'Active' | 'Inactive' | 'Pilot';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DailyMenu {
  id: string;
  date: string;
  sppgId: string;
  menuItems: Menu[];
  totalCalories: number;
  notes?: string;
}

// Sample data based on real information from Sumedang
export const sampleSPPGs: SPPG[] = [
  {
    id: 'sppg-001',
    name: 'Dapur Satelit Modular Sirah Cai',
    type: 'Dapur Satelit Modular',
    capacity: 600,
    location: 'Kecamatan Sirah Cai, Sumedang',
    contact: {
      phone: '+62-261-123456',
      email: 'dapur.sirahcai@sumedangkab.go.id',
      address: 'Jl. Raya Sirah Cai No. 123, Sumedang'
    },
    facilities: [
      'Kompor gas industri',
      'Rice cooker besar',
      'Kulkas penyimpanan',
      'Area cuci piring',
      'Sistem ventilasi'
    ],
    operatingHours: {
      start: '06:00',
      end: '14:00'
    },
    schools: ['school-001', 'school-002'],
    coordinates: { lat: -6.8333, lng: 107.9167 },
    kitchenPhoto: 'https://placehold.co/800x600/4F46E5/FFFFFF/png?text=Dapur+Satelit+Modular+Sirah+Cai',
    nutritionist: {
      name: 'Dr. Siti Nurhaliza, S.Gz, M.Gizi',
      qualification: 'Magister Gizi Klinik',
      experience: '8 tahun pengalaman di bidang gizi sekolah',
      photo: 'https://placehold.co/200x200/10B981/FFFFFF/png?text=Dr.+Siti+Nurhaliza'
    },
    slhsCertificate: {
      fileUrl: 'https://placehold.co/800x600/DC2626/FFFFFF/pdf?text=Sertifikat+Laik+Higiene+Sanitasi',
      issueDate: '2024-01-15',
      expiryDate: '2025-01-15',
      certificateNumber: 'SLHS/SUMEDANG/2024/001'
    }
  },
  {
    id: 'sppg-002',
    name: 'Dapur Pusat Tanjungsari',
    type: 'Dapur Pusat',
    capacity: 1000,
    location: 'Kecamatan Tanjungsari, Sumedang',
    contact: {
      phone: '+62-261-234567',
      email: 'dapur.tanjungsari@sumedangkab.go.id',
      address: 'Jl. Raya Tanjungsari No. 456, Sumedang'
    },
    facilities: [
      'Dapur industri lengkap',
      'Sistem pendingin',
      'Area distribusi',
      'Kendaraan pengantar',
      'Sistem monitoring'
    ],
    operatingHours: {
      start: '05:00',
      end: '15:00'
    },
    schools: ['school-003', 'school-004', 'school-005'],
    coordinates: { lat: -6.8500, lng: 107.9000 },
    kitchenPhoto: 'https://placehold.co/800x600/7C3AED/FFFFFF/png?text=Dapur+Pusat+Tanjungsari',
    nutritionist: {
      name: 'Prof. Dr. Ahmad Wijaya, S.Gz, M.Sc, Ph.D',
      qualification: 'Doktor Ilmu Gizi',
      experience: '12 tahun pengalaman di bidang gizi masyarakat',
      photo: 'https://placehold.co/200x200/059669/FFFFFF/png?text=Prof.+Dr.+Ahmad+Wijaya'
    },
    slhsCertificate: {
      fileUrl: 'https://placehold.co/800x600/DC2626/FFFFFF/pdf?text=Sertifikat+Laik+Higiene+Sanitasi',
      issueDate: '2024-02-01',
      expiryDate: '2025-02-01',
      certificateNumber: 'SLHS/SUMEDANG/2024/002'
    }
  }
];

export const sampleSchools: School[] = [
  {
    id: 'school-001',
    name: 'SDN Sirah Cai',
    level: 'SD',
    address: 'Jl. Pendidikan No. 1, Sirah Cai, Sumedang',
    district: 'Sirah Cai',
    village: 'Sirah Cai',
    sppgId: 'sppg-001',
    studentCount: 250,
    programStartDate: '2024-11-18',
    status: 'Active',
    coordinates: { lat: -6.8333, lng: 107.9167 }
  },
  {
    id: 'school-002',
    name: 'SDN Sirah Cai 2',
    level: 'SD',
    address: 'Jl. Merdeka No. 15, Sirah Cai, Sumedang',
    district: 'Sirah Cai',
    village: 'Sirah Cai',
    sppgId: 'sppg-001',
    studentCount: 180,
    programStartDate: '2024-11-18',
    status: 'Active',
    coordinates: { lat: -6.8350, lng: 107.9180 }
  },
  {
    id: 'school-003',
    name: 'SDN Tanjungsari 1',
    level: 'SD',
    address: 'Jl. Pendidikan No. 10, Tanjungsari, Sumedang',
    district: 'Tanjungsari',
    village: 'Tanjungsari',
    sppgId: 'sppg-002',
    studentCount: 320,
    programStartDate: '2025-02-17',
    status: 'Active',
    coordinates: { lat: -6.8500, lng: 107.9000 }
  },
  {
    id: 'school-004',
    name: 'SDN Tanjungsari 2',
    level: 'SD',
    address: 'Jl. Kartini No. 5, Tanjungsari, Sumedang',
    district: 'Tanjungsari',
    village: 'Tanjungsari',
    sppgId: 'sppg-002',
    studentCount: 280,
    programStartDate: '2025-02-17',
    status: 'Active',
    coordinates: { lat: -6.8480, lng: 107.9020 }
  },
  {
    id: 'school-005',
    name: 'SMPN 1 Tanjungsari',
    level: 'SMP',
    address: 'Jl. Pahlawan No. 20, Tanjungsari, Sumedang',
    district: 'Tanjungsari',
    village: 'Tanjungsari',
    sppgId: 'sppg-002',
    studentCount: 400,
    programStartDate: '2025-02-17',
    status: 'Active',
    coordinates: { lat: -6.8520, lng: 107.8980 }
  }
];

export const sampleMenus: Menu[] = [
  {
    id: 'menu-001',
    name: 'Nasi Putih',
    description: 'Nasi putih berkualitas tinggi',
    nutritionInfo: {
      calories: 200,
      protein: 4,
      carbs: 45,
      fat: 0.5
    },
    allergens: [],
    image: '/images/nasi-putih.jpg'
  },
  {
    id: 'menu-002',
    name: 'Ayam Goreng',
    description: 'Ayam goreng dengan bumbu tradisional',
    nutritionInfo: {
      calories: 250,
      protein: 25,
      carbs: 2,
      fat: 15
    },
    allergens: [],
    image: '/images/ayam-goreng.jpg'
  },
  {
    id: 'menu-003',
    name: 'Sayur Bayam',
    description: 'Sayur bayam segar dengan bumbu ringan',
    nutritionInfo: {
      calories: 30,
      protein: 3,
      carbs: 5,
      fat: 0.5
    },
    allergens: [],
    image: '/images/sayur-bayam.jpg'
  },
  {
    id: 'menu-004',
    name: 'Buah Apel',
    description: 'Buah apel segar sebagai pencuci mulut',
    nutritionInfo: {
      calories: 80,
      protein: 0.3,
      carbs: 21,
      fat: 0.2
    },
    allergens: [],
    image: '/images/apel.jpg'
  },
  {
    id: 'menu-005',
    name: 'Tempe Bacem',
    description: 'Tempe bacem dengan bumbu Jawa',
    nutritionInfo: {
      calories: 150,
      protein: 12,
      carbs: 15,
      fat: 6
    },
    allergens: ['Kedelai'],
    image: '/images/tempe-bacem.jpg'
  },
  {
    id: 'menu-006',
    name: 'Sop Sayuran',
    description: 'Sop sayuran segar dengan kaldu alami',
    nutritionInfo: {
      calories: 60,
      protein: 2,
      carbs: 8,
      fat: 1
    },
    allergens: [],
    image: '/images/sop-sayuran.jpg'
  }
];

export const sampleDailyMenus: DailyMenu[] = [
  {
    id: 'daily-001',
    date: new Date().toISOString().split('T')[0], // Today's date
    sppgId: 'sppg-001',
    menuItems: ['menu-001', 'menu-002', 'menu-003', 'menu-004'].map(id => 
      sampleMenus.find(menu => menu.id === id)!
    ),
    totalCalories: 560,
    notes: 'Menu khusus hari ini dengan fokus protein tinggi'
  },
  {
    id: 'daily-002',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow's date
    sppgId: 'sppg-001',
    menuItems: ['menu-001', 'menu-005', 'menu-006', 'menu-004'].map(id => 
      sampleMenus.find(menu => menu.id === id)!
    ),
    totalCalories: 470,
    notes: 'Menu vegetarian-friendly untuk besok'
  },
  {
    id: 'daily-003',
    date: new Date().toISOString().split('T')[0], // Today's date
    sppgId: 'sppg-002',
    menuItems: ['menu-001', 'menu-002', 'menu-003', 'menu-004'].map(id => 
      sampleMenus.find(menu => menu.id === id)!
    ),
    totalCalories: 560,
    notes: 'Menu standar untuk semua sekolah di Tanjungsari'
  },
  {
    id: 'daily-004',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
    sppgId: 'sppg-002',
    menuItems: ['menu-001', 'menu-005', 'menu-006', 'menu-004'].map(id => 
      sampleMenus.find(menu => menu.id === id)!
    ),
    totalCalories: 470,
    notes: 'Menu bervariasi untuk hari Rabu'
  }
];

// Export the data arrays with consistent names
export const schools = sampleSchools;
export const sppgs = sampleSPPGs;
export const menus = sampleMenus;
export const dailyMenus = sampleDailyMenus;

// Helper functions
export function getSchoolById(id: string): School | undefined {
  return sampleSchools.find(school => school.id === id);
}

export function getSPPGById(id: string): SPPG | undefined {
  return sampleSPPGs.find(sppg => sppg.id === id);
}

export function getSchoolsBySPPG(sppgId: string): School[] {
  return sampleSchools.filter(school => school.sppgId === sppgId);
}

export function getDailyMenuBySPPG(sppgId: string, date?: string): DailyMenu[] {
  if (date) {
    return sampleDailyMenus.filter(menu => 
      menu.sppgId === sppgId && menu.date === date
    );
  }
  
  // If no date specified, return all menus for this SPPG (today and future)
  const today = new Date().toISOString().split('T')[0];
  return sampleDailyMenus.filter(menu => 
    menu.sppgId === sppgId && menu.date >= today
  );
}

export function searchSchools(query: string): School[] {
  const lowercaseQuery = query.toLowerCase();
  return sampleSchools.filter(school => 
    school.name.toLowerCase().includes(lowercaseQuery) ||
    school.district.toLowerCase().includes(lowercaseQuery) ||
    school.village.toLowerCase().includes(lowercaseQuery) ||
    school.address.toLowerCase().includes(lowercaseQuery)
  );
}

export function getSchoolsByDistrict(district: string): School[] {
  return sampleSchools.filter(school => school.district === district);
}

export function getSchoolsByVillage(village: string): School[] {
  return sampleSchools.filter(school => school.village === village);
}

export function searchSPPGs(query: string): SPPG[] {
  const lowercaseQuery = query.toLowerCase();
  return sampleSPPGs.filter(sppg => 
    sppg.name.toLowerCase().includes(lowercaseQuery) ||
    sppg.type.toLowerCase().includes(lowercaseQuery) ||
    sppg.location.toLowerCase().includes(lowercaseQuery) ||
    sppg.contact.address.toLowerCase().includes(lowercaseQuery)
  );
}

export function getSPPGsByType(type: string): SPPG[] {
  return sampleSPPGs.filter(sppg => sppg.type === type);
}

export function getSPPGsByLocation(location: string): SPPG[] {
  return sampleSPPGs.filter(sppg => 
    sppg.location.toLowerCase().includes(location.toLowerCase())
  );
}
