import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'discmap-onboarding';
const CURRENT_VERSION = 1;

export type OnboardingStep =
  | 'welcome'
  | 'map'
  | 'toolbar'
  | 'sidebar'
  | 'export'
  | 'complete';

interface OnboardingState {
  isActive: boolean;
  currentStep: OnboardingStep;
  completedAt: string | null;
  version: number;
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: OnboardingStep;
  stepIndex: number;
  totalSteps: number;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const STEPS: OnboardingStep[] = ['welcome', 'map', 'toolbar', 'sidebar', 'export', 'complete'];

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function loadState(): OnboardingState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function saveState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  // Check if this is a first-time visitor
  useEffect(() => {
    const state = loadState();

    if (!state || state.version < CURRENT_VERSION) {
      // First visit or outdated version - show onboarding after a brief delay
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep('welcome');
      }, 1500); // Wait for app to load

      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setIsActive(true);
    setCurrentStep('welcome');
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(() => {
    setIsActive(false);
    saveState({
      isActive: false,
      currentStep: 'complete',
      completedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
    });
  }, []);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsActive(true);
    setCurrentStep('welcome');
  }, []);

  const stepIndex = STEPS.indexOf(currentStep);
  const totalSteps = STEPS.length - 1; // Exclude 'complete' from count

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        stepIndex,
        totalSteps,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
