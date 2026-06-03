'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SPPG } from '@/lib/data';
import SPPGInfoTab from './SPPGInfoTab';
import SPPGDistributionTab from './SPPGDistributionTab';
import SPPGReportsTab from './SPPGReportsTab';

interface SPPGInfoTabsProps {
  sppg: SPPG;
}

export default function SPPGInfoTabs({ sppg }: SPPGInfoTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'info' | 'distribution' | 'reports'>('info');

  // Set initial tab from URL parameter
  useEffect(() => {
    if (tabParam === 'reports') {
      setActiveTab('reports');
    } else if (tabParam === 'distribution') {
      setActiveTab('distribution');
    }
  }, [tabParam]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with SPPG name */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
        <h1 className="text-3xl font-bold text-white">{sppg.name}</h1>
        <p className="text-blue-100 mt-2">{sppg.location || 'Lokasi tidak tersedia'}</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informasi SPPG
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'distribution'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Distribusi
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Laporan Sekolah
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'info' && <SPPGInfoTab sppg={sppg} />}
        {activeTab === 'distribution' && <SPPGDistributionTab sppg={sppg} />}
        {activeTab === 'reports' && <SPPGReportsTab sppgId={sppg.id} />}
      </div>
    </div>
  );
}