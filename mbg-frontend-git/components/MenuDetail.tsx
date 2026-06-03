'use client';

import { IconFlame, IconDroplet, IconLeaf, IconMeat, IconAlertTriangle, IconCalendar } from '@tabler/icons-react';
import { DailyMenu } from '@/lib/data';

interface MenuDetailProps {
  dailyMenu: DailyMenu;
}

export default function MenuDetail({ dailyMenu }: MenuDetailProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNutritionColor = (value: number, type: 'calories' | 'protein' | 'carbs' | 'fat') => {
    const thresholds = {
      calories: { low: 50, high: 200 },
      protein: { low: 5, high: 20 },
      carbs: { low: 10, high: 40 },
      fat: { low: 2, high: 15 }
    };

    if (value < thresholds[type].low) return 'text-red-500';
    if (value > thresholds[type].high) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-6 py-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <IconCalendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Menu Harian</h2>
            <p className="text-green-100">{formatDate(dailyMenu.date)}</p>
          </div>
        </div>
        
        {dailyMenu.notes && (
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-green-100 text-sm">{dailyMenu.notes}</p>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Total Nutrition Summary */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Nutrisi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                <IconFlame className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dailyMenu.totalCalories}</p>
              <p className="text-sm text-gray-600">Kalori</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                <IconMeat className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dailyMenu.menuItems.reduce((sum, item) => sum + item.nutritionInfo.protein, 0).toFixed(1)}g
              </p>
              <p className="text-sm text-gray-600">Protein</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                <IconLeaf className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dailyMenu.menuItems.reduce((sum, item) => sum + item.nutritionInfo.carbs, 0).toFixed(1)}g
              </p>
              <p className="text-sm text-gray-600">Karbohidrat</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                <IconDroplet className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {dailyMenu.menuItems.reduce((sum, item) => sum + item.nutritionInfo.fat, 0).toFixed(1)}g
              </p>
              <p className="text-sm text-gray-600">Lemak</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daftar Menu</h3>
          <div className="space-y-6">
            {dailyMenu.menuItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                  {item.image && (
                    <div className="ml-4 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Foto</span>
                    </div>
                  )}
                </div>

                {/* Nutrition Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-1">
                      <IconFlame className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className={`text-lg font-semibold ${getNutritionColor(item.nutritionInfo.calories, 'calories')}`}>
                      {item.nutritionInfo.calories}
                    </p>
                    <p className="text-xs text-gray-600">kal</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-1">
                      <IconMeat className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className={`text-lg font-semibold ${getNutritionColor(item.nutritionInfo.protein, 'protein')}`}>
                      {item.nutritionInfo.protein}g
                    </p>
                    <p className="text-xs text-gray-600">protein</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-1">
                      <IconLeaf className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className={`text-lg font-semibold ${getNutritionColor(item.nutritionInfo.carbs, 'carbs')}`}>
                      {item.nutritionInfo.carbs}g
                    </p>
                    <p className="text-xs text-gray-600">karbohidrat</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-1">
                      <IconDroplet className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className={`text-lg font-semibold ${getNutritionColor(item.nutritionInfo.fat, 'fat')}`}>
                      {item.nutritionInfo.fat}g
                    </p>
                    <p className="text-xs text-gray-600">lemak</p>
                  </div>
                </div>

                {/* Allergens */}
                {item.allergens.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Mengandung: </span>
                    <div className="flex space-x-2">
                      {item.allergens.map((allergen, idx) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
