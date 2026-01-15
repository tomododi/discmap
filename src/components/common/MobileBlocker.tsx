import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Smartphone } from 'lucide-react';

export function MobileBlocker({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width and touch capability
      const isMobileWidth = window.innerWidth < 1024;
      const hasTouchOnly = 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches;
      setIsMobile(isMobileWidth || hasTouchOnly);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          {/* Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Smartphone className="w-16 h-16 text-red-400 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-1 bg-red-500 rotate-45 rounded-full" />
              </div>
            </div>
            <Monitor className="w-20 h-20 text-emerald-400 ml-4" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            {t('mobile.title')}
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-lg mb-6">
            {t('mobile.description')}
          </p>

          {/* Features list */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-slate-400 text-sm">
              {t('mobile.features')}
            </p>
          </div>

          {/* App name */}
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" fill="#1e293b" />
            </svg>
            <span className="font-bold text-xl">DiscMap</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
