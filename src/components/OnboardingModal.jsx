import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  Calendar,
  Users,
  Building2,
  Keyboard,
  Mouse,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle,
  X
} from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'crs_onboarding_completed';

/**
 * Onboarding modal for first-time users
 * Shows key features and how to use the app
 */
export default function OnboardingModal({ forceShow = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Calendar,
      title: 'Welcome to Clinical Review Scheduler',
      description: 'A powerful tool for managing clinical review schedules across your organization.',
      features: [
        'Create and manage multiple schedules',
        'Assign employees to entities',
        'Track workloads and detect conflicts',
        'Auto-save your changes automatically',
      ],
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description: 'Work faster with these keyboard shortcuts:',
      shortcuts: [
        { keys: 'Ctrl + S', action: 'Save changes' },
        { keys: 'Ctrl + Z', action: 'Undo last action' },
        { keys: 'Ctrl + Y', action: 'Redo action' },
        { keys: 'Ctrl + N', action: 'Create new schedule' },
        { keys: '?', action: 'Show all shortcuts' },
      ],
    },
    {
      icon: Users,
      title: 'Managing Employees',
      description: 'Keep track of your team and their skills.',
      features: [
        'Add employees with their skills (DAR, CPOE, Trace, Float)',
        'Track training status and certifications',
        'View assignment history',
        'Archive inactive employees',
      ],
    },
    {
      icon: Building2,
      title: 'Entity Assignments',
      description: 'Easily assign employees to entities on the schedule grid.',
      features: [
        'Click cells to make assignments',
        'Use bulk assignment for multiple selections',
        'See workload indicators for balance',
        'Conflict detection alerts you to issues',
      ],
    },
  ];

  useEffect(() => {
    // Check if user has seen onboarding
    if (forceShow) {
      setIsOpen(true);
      return;
    }

    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasCompleted) {
      // Small delay to let the app load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title=""
      size="lg"
      showCloseButton={false}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute -top-2 -right-2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-all"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-thr-blue-500 w-8'
                  : index < currentStep
                  ? 'bg-thr-green-500'
                  : 'bg-slate-200 dark:bg-slate-600'
              }`}
              aria-label={`Go to step ${index + 1}`}
              aria-current={index === currentStep ? 'step' : undefined}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-thr-blue-500 to-thr-green-500 flex items-center justify-center shadow-lg">
            <StepIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100 mb-2">
          {currentStepData.title}
        </h2>

        {/* Description */}
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          {currentStepData.description}
        </p>

        {/* Content */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6">
          {currentStepData.features && (
            <ul className="space-y-3">
              {currentStepData.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-thr-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {currentStepData.shortcuts && (
            <div className="space-y-2">
              {currentStepData.shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-600 last:border-0">
                  <kbd className="px-2.5 py-1 bg-white dark:bg-slate-600 rounded-lg text-sm font-mono shadow-sm border border-slate-200 dark:border-slate-500">
                    {shortcut.keys}
                  </kbd>
                  <span className="text-slate-600 dark:text-slate-400">{shortcut.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-thr-blue-500 hover:bg-thr-blue-600 text-white font-semibold rounded-xl transition-all shadow-soft hover:shadow-soft-md"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hook to reset onboarding for testing
 */
export function useResetOnboarding() {
  return () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    window.location.reload();
  };
}
