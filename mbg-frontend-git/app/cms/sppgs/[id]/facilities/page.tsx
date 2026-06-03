'use client';

import { useParams } from 'next/navigation';
import CMSLayout from '@/components/cms/layout/CMSLayout';
import ClientOnly from '@/components/cms/ClientOnly';
import SPPGFacilities from '@/components/cms/sppgs/SPPGFacilities';

export default function SPPGFacilitiesPage() {
  const params = useParams();

  return (
    <CMSLayout>
      <ClientOnly fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fasilitas SPPG</h1>
            <p className="text-gray-600">Kelola fasilitas yang tersedia di SPPG</p>
          </div>
          
          {params.id && <SPPGFacilities sppgId={params.id as string} />}
        </div>
      </ClientOnly>
    </CMSLayout>
  );
}
