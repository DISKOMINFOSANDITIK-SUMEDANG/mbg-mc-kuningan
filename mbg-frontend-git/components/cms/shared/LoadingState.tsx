'use client';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({ 
  message = "Memuat data...", 
  className = "" 
}: LoadingStateProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function PageLoadingState({ 
  message = "Memuat halaman...", 
  className = "" 
}: LoadingStateProps) {
  return (
    <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

