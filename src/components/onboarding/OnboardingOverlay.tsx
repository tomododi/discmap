import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding, type OnboardingStep } from './OnboardingContext';
import {
  Map,
  MousePointer2,
  Layers,
  FileImage,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  Disc,
  Sparkles,
} from 'lucide-react';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  padding?: number;
}

interface StepConfig {
  step: OnboardingStep;
  icon: React.ReactNode;
  targetSelector?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

const STEP_CONFIGS: StepConfig[] = [
  { step: 'welcome', icon: <Disc className="w-8 h-8" />, position: 'center' },
  {
    step: 'map',
    icon: <Map className="w-6 h-6" />,
    targetSelector: '.maplibregl-canvas',
    position: 'center',
    spotlightPadding: 0,
  },
  {
    step: 'toolbar',
    icon: <MousePointer2 className="w-6 h-6" />,
    targetSelector: '[class*="absolute top-4 left-1/2"]',
    position: 'bottom',
    spotlightPadding: 16,
  },
  {
    step: 'sidebar',
    icon: <Layers className="w-6 h-6" />,
    targetSelector: '[class*="absolute top-4 bottom-4"]',
    position: 'right',
    spotlightPadding: 8,
  },
  {
    step: 'export',
    icon: <FileImage className="w-6 h-6" />,
    position: 'center',
  },
  { step: 'complete', icon: <Sparkles className="w-8 h-8" />, position: 'center' },
];

function getTargetRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function OnboardingOverlay() {
  const { t } = useTranslation();
  const {
    isActive,
    currentStep,
    stepIndex,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentConfig = STEP_CONFIGS.find((c) => c.step === currentStep);

  // Update spotlight position when step changes
  useEffect(() => {
    if (!isActive) return;

    // Animation state for step transitions - intentional effect-based setState
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 200);

    if (currentConfig?.targetSelector) {
      const updateRect = () => {
        const rect = getTargetRect(currentConfig.targetSelector!);
        if (rect && currentConfig.spotlightPadding) {
          rect.top -= currentConfig.spotlightPadding;
          rect.left -= currentConfig.spotlightPadding;
          rect.width += currentConfig.spotlightPadding * 2;
          rect.height += currentConfig.spotlightPadding * 2;
        }
        setSpotlightRect(rect);
      };

      // Wait for elements to be ready
      requestAnimationFrame(() => {
        setTimeout(updateRect, 100);
      });
    } else {
      setSpotlightRect(null);
    }

    return () => clearTimeout(timer);
  }, [isActive, currentStep, currentConfig]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipOnboarding();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep === 'complete') {
          completeOnboarding();
        } else {
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, nextStep, prevStep, skipOnboarding, completeOnboarding]);

  if (!isActive) return null;

  const isFirstStep = stepIndex === 0;
  const isLastStep = currentStep === 'complete';
  const showSpotlight = spotlightRect && !isFirstStep && !isLastStep;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-auto"
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop with spotlight cutout */}
      <div className="absolute inset-0 transition-opacity duration-500">
        {showSpotlight ? (
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotlightRect.left}
                  y={spotlightRect.top}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="16"
                  fill="black"
                  className="transition-all duration-500 ease-out"
                />
              </mask>
              <linearGradient id="backdrop-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(15, 23, 42, 0.92)" />
                <stop offset="100%" stopColor="rgba(30, 41, 59, 0.88)" />
              </linearGradient>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#backdrop-gradient)"
              mask="url(#spotlight-mask)"
            />
          </svg>
        ) : (
          <div
            className={`
              absolute inset-0 transition-all duration-700
              ${isFirstStep || isLastStep ? 'bg-gradient-to-br from-slate-900/95 via-emerald-950/90 to-slate-900/95' : 'bg-slate-900/85'}
            `}
          />
        )}
      </div>

      {/* Decorative background elements for welcome/complete */}
      {(isFirstStep || isLastStep) && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Topographic lines pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="xMidYMid slice">
            <pattern id="topo-lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#topo-lines)" />
          </svg>

          {/* Static ambient glow shapes */}
          <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute bottom-[20%] right-[15%] w-48 h-48 rounded-full bg-amber-500/8 blur-3xl" />
          <div className="absolute top-[60%] left-[60%] w-24 h-24 rounded-full bg-teal-500/8 blur-2xl" />
        </div>
      )}

      {/* Spotlight ring glow effect */}
      {showSpotlight && spotlightRect && (
        <div
          className="absolute pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: spotlightRect.top - 4,
            left: spotlightRect.left - 4,
            width: spotlightRect.width + 8,
            height: spotlightRect.height + 8,
          }}
        >
          <div className="absolute inset-0 rounded-[20px] ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/20" />
        </div>
      )}

      {/* Content Card */}
      <div
        className={`
          absolute transition-all duration-300 ease-out
          ${isAnimating ? 'opacity-80 translate-y-1' : 'opacity-100 translate-y-0'}
        `}
        style={getCardStyle(currentConfig?.position, spotlightRect)}
      >
        <div
          className={`
            relative bg-white rounded-2xl shadow-2xl overflow-hidden
            ${isFirstStep || isLastStep ? 'w-[420px] max-w-[90vw]' : 'w-[340px] max-w-[85vw]'}
          `}
        >
          {/* Card header accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Close button */}
          <button
            onClick={skipOnboarding}
            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {/* Card content */}
          <div className={`p-6 ${isFirstStep || isLastStep ? 'pt-8' : 'pt-6'}`}>
            {/* Icon */}
            <div
              className={`
                inline-flex items-center justify-center rounded-xl mb-4
                ${isFirstStep || isLastStep
                  ? 'w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'w-12 h-12 bg-emerald-50 text-emerald-600'
                }
              `}
            >
              {currentConfig?.icon}
            </div>

            {/* Title */}
            <h2
              className={`
                font-bold text-gray-900 mb-2
                ${isFirstStep || isLastStep ? 'text-2xl' : 'text-lg'}
              `}
            >
              {t(`onboarding.${currentStep}.title`)}
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              {t(`onboarding.${currentStep}.description`)}
            </p>

            {/* Tips for specific steps */}
            {currentStep === 'map' && (
              <div className="mb-5 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Target size={14} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                  <span>{t('onboarding.map.tip')}</span>
                </div>
              </div>
            )}

            {/* Progress indicator */}
            {!isLastStep && (
              <div className="flex items-center gap-2 mb-5">
                {STEP_CONFIGS.slice(0, -1).map((config, idx) => (
                  <div
                    key={config.step}
                    className={`
                      h-1.5 rounded-full transition-all duration-300
                      ${idx === stepIndex
                        ? 'w-6 bg-emerald-500'
                        : idx < stepIndex
                          ? 'w-3 bg-emerald-300'
                          : 'w-3 bg-gray-200'
                      }
                    `}
                  />
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {!isFirstStep && !isLastStep && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                  {t('onboarding.back')}
                </button>
              )}

              <div className="flex-1" />

              {isFirstStep && (
                <button
                  onClick={skipOnboarding}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('onboarding.skip')}
                </button>
              )}

              <button
                onClick={isLastStep ? completeOnboarding : nextStep}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isFirstStep || isLastStep
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }
                `}
              >
                {isFirstStep
                  ? t('onboarding.start')
                  : isLastStep
                    ? t('onboarding.finish')
                    : t('onboarding.next')}
                {!isLastStep && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      {!isFirstStep && !isLastStep && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd>
            {t('onboarding.keyboardHint')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
            {t('onboarding.escHint')}
          </span>
        </div>
      )}
    </div>
  );
}

function getCardStyle(
  position: StepConfig['position'],
  spotlightRect: SpotlightRect | null
): React.CSSProperties {
  if (!spotlightRect || position === 'center') {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  switch (position) {
    case 'bottom':
      return {
        top: Math.min(spotlightRect.top + spotlightRect.height + 24, viewportHeight - 320),
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'top':
      return {
        bottom: viewportHeight - spotlightRect.top + 24,
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        top: '50%',
        right: viewportWidth - spotlightRect.left + 24,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        top: '50%',
        left: Math.min(spotlightRect.left + spotlightRect.width + 24, viewportWidth - 360),
        transform: 'translateY(-50%)',
      };
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
  }
}
