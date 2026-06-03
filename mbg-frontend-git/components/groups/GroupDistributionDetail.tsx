'use client';

import { useState, useEffect } from 'react';
import { IconUsers, IconCalendar, IconChefHat, IconMapPin, IconNotes } from '@tabler/icons-react';
import { DailyDistribution, getDistributions, getGroupById, Group } from '@/lib/api-client';

interface GroupDistributionDetailProps {
  sppgId: string;
  groupId: string;
}

export default function GroupDistributionDetail({ sppgId, groupId }: GroupDistributionDetailProps) {
  const [distributions, setDistributions] = useState<DailyDistribution[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string>('');

  useEffect(() => {
    const loadDistributions = async () => {
      setLoading(true);
      try {
        const data = await getDistributions({
          recipientId: groupId,
          recipientType: 'group',
          date: selectedDate || undefined
        });

        // Fetch group details
        const groupData = await getGroupById(groupId);

        // Safety filter
        const filtered = Array.isArray(data)
          ? data.filter(d => d.recipientType === 'group' && d.recipientId === groupId)
          : [];
        setDistributions(filtered);
        setGroup(groupData);
      } catch (error) {
        console.error('Error loading distributions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadDistributions();
    }
  }, [groupId, selectedDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRecipientTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'bg-blue-100 text-blue-800';
      case 'group': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    switch (type) {
      case 'school': return 'Sekolah';
      case 'group': return 'Kelompok';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data distribusi...</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Filter by Date */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <IconCalendar className="h-5 w-5 text-gray-400" />
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter berdasarkan tanggal:
            </label>
            <input
              type="date"
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="ml-2 text-sm text-green-600 hover:text-green-800"
              >
                Hapus filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Distributions List */}
      {distributions.length > 0 ? (
        <div className="space-y-6">
          {distributions.map((distribution) => (
            <div key={distribution.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Distribusi {formatDate(distribution.distributionDate)}
                </h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecipientTypeColor(distribution.recipientType)}`}>
                    {getRecipientTypeLabel(distribution.recipientType)}
                  </span>
                  <span className="text-lg font-semibold text-gray-700">
                    {distribution.portions} porsi
                  </span>
                  {group && (
                    <span className="text-sm text-gray-600">
                      untuk {group.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Section */}
              {distribution.menu && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <IconChefHat className="h-5 w-5 text-green-600 mr-2" />
                    Menu:
                  </h4>
                  
              {/* Menu Image, Nama Menu, dan Ringkasan Nutrisi */}
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Menu Image with Lightbox */}
                {distribution.menu.image && (
                  <div className="flex-shrink-0 flex justify-center md:justify-start">
                    <img
                      src={distribution.menu.image}
                      alt="Menu"
                      className="w-64 h-64 object-cover rounded-xl border border-gray-200 shadow-sm cursor-zoom-in"
                      onClick={() => { setLightboxSrc(distribution.menu!.image!); setLightboxOpen(true); }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/256x256/cccccc/666666?text=Menu+Sehat';
                      }}
                    />
                  </div>
                )}

                {/* Right column: Nama Menu + Ringkasan Nutrisi */}
                <div className="flex-1 space-y-4">
                  {distribution.menu?.name && (
                      <h5 className="text-xl font-semibold text-gray-900 mb-3">{distribution.menu.name}</h5>
                  )}

                  {/* Ringkasan Nutrisi (Totals) */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Nutrisi</h5>
                    {(() => {
                    const items = distribution.menu?.menuItems || [];
                    const totals = items.reduce((acc, it) => {
                      acc.calories += it.nutritionInfo?.calories || 0;
                      acc.protein += Number(it.nutritionInfo?.protein || 0);
                      acc.carbs += Number(it.nutritionInfo?.carbs || 0);
                      acc.fat += Number(it.nutritionInfo?.fat || 0);
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-lg bg-white border border-green-100 p-4 text-center">
                          <div className="text-xs uppercase tracking-wide text-green-600 mb-1">Total Kalori</div>
                          <div className="text-2xl font-bold text-green-700">{totals.calories}</div>
                        </div>
                        <div className="rounded-lg bg-white border border-blue-100 p-4 text-center">
                          <div className="text-xs uppercase tracking-wide text-blue-600 mb-1">Total Protein</div>
                          <div className="text-2xl font-bold text-blue-700">{Math.round(totals.protein)}g</div>
                        </div>
                        <div className="rounded-lg bg-white border border-indigo-100 p-4 text-center">
                          <div className="text-xs uppercase tracking-wide text-indigo-600 mb-1">Total Karbo</div>
                          <div className="text-2xl font-bold text-indigo-700">{Math.round(totals.carbs)}g</div>
                        </div>
                        <div className="rounded-lg bg-white border border-orange-100 p-4 text-center">
                          <div className="text-xs uppercase tracking-wide text-orange-600 mb-1">Total Lemak</div>
                          <div className="text-2xl font-bold text-orange-700">{Math.round(totals.fat)}g</div>
                        </div>
                      </div>
                    );
                  })()}
                  </div>
                </div>
              </div>

                  {/* Daftar Menu Items */}
                  {distribution.menu.menuItems && distribution.menu.menuItems.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Detail Makanan <span className="text-gray-500 text-sm">(Total Item: {distribution.menu.menuItems.length})</span></h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {distribution.menu.menuItems.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <h6 className="font-medium text-gray-900">{item.name}</h6>
                              <span className="text-sm text-gray-600">{item.nutritionInfo.calories} kkal</span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                              <span>Protein: {item.nutritionInfo.protein}g</span>
                              <span>Karbohidrat: {item.nutritionInfo.carbs}g</span>
                              <span>Lemak: {item.nutritionInfo.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Catatan */}
              {distribution.notes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <IconNotes className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Catatan:</h4>
                      <p className="text-sm text-gray-700">{distribution.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <IconChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Distribusi</h3>
          <p className="text-gray-600">
            {selectedDate 
              ? `Belum ada distribusi untuk tanggal ${formatDate(selectedDate)}`
              : 'Belum ada data distribusi untuk kelompok ini'
            }
          </p>
        </div>
      )}
    </div>
    {/* Lightbox */}
    {lightboxOpen && (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
        <img src={lightboxSrc} alt="Preview" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
      </div>
    )}
    </>
  );
}
