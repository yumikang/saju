/**
 * Renaming Service Layout
 *
 * URL-based nested routing layout for renaming service.
 * Replaces state-based navigation with Remix's file-based routing.
 *
 * Routes:
 * - /renaming → renaming._index.tsx (Step 1: Info input)
 * - /renaming/analysis → renaming.analysis.tsx (Step 2: Current name analysis)
 * - /renaming/results → renaming.results.tsx (Step 3: Renaming recommendations)
 * - /renaming/experts → renaming.experts.tsx (Step 4: Expert proposals)
 *
 * @created 2025-10-28
 * @refactor Phase 2: Layout file with URL-based navigation
 */

import { Outlet, useLocation } from '@remix-run/react';
import { RENAMING_STEPS, getCurrentStepFromPath, type RenamingStep } from '~/lib/renaming/types';

/**
 * Progress indicator component
 * Automatically determines current step from URL pathname
 */
function ProgressIndicator() {
  const location = useLocation();
  const currentStep = getCurrentStepFromPath(location.pathname);
  const currentOrder = RENAMING_STEPS[currentStep].order;

  const steps = [
    { key: 'input', label: '정보입력' },
    { key: 'analysis', label: '현재분석' },
    { key: 'results', label: '개명제안' },
    { key: 'experts', label: '전문가제안' },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${index + 1 <= currentOrder
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'}
              `}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-0.5 bg-gray-300 ml-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main layout component
 * Renders progress indicator and nested routes via <Outlet />
 */
export default function RenamingLayout() {
  return (
    <div className="bg-gradient-to-b from-orange-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ProgressIndicator />

        {/* Nested routes will be rendered here */}
        <Outlet />
      </div>
    </div>
  );
}
