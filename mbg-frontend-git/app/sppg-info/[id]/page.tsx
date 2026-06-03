'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/shared/AppLayout';
import { DetailPageSkeleton } from '@/components/shared/PageSkeletons';
import { getSPPGById, SPPG } from '@/lib/api-client';
import SPPGInfoTabs from '@/components/sppg/SPPGInfoTabs';

export default function SPPGInfoPage() {
  const params = useParams();
  const [sppg, setSppg] = useState<SPPG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadSPPG = async () => {
      try {
        setLoading(true);
        const sppgData = await getSPPGById(params.id as string);
        if (!sppgData) {
          setError(true);
        } else {
          setSppg(sppgData);
        }
      } catch (err) {
        console.error('Error fetching SPPG:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadSPPG();
    }
  }, [params.id]);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (error || !sppg) {
    return (
      <AppLayout className="bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">SPPG Tidak Ditemukan</h1>
            <p className="text-gray-600">SPPG yang Anda cari tidak ditemukan atau telah dihapus.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="bg-white">
      <section className="py-16 px-6 sm:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <SPPGInfoTabs sppg={sppg} />
        </div>
      </section>
    </AppLayout>
  );
}