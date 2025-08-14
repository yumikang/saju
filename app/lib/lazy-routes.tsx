import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// 로딩 컴포넌트
export function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

// Lazy loaded routes
export const LazyNamingRoute = lazy(() => 
  import('../routes/naming').then(module => ({ default: module.default }))
);

export const LazyRenamingRoute = lazy(() => 
  import('../routes/renaming').then(module => ({ default: module.default }))
);

export const LazySajuRoute = lazy(() => 
  import('../routes/saju').then(module => ({ default: module.default }))
);

export const LazyResultRoute = lazy(() => 
  import('../routes/result.$id').then(module => ({ default: module.default }))
);

export const LazyDashboardRoute = lazy(() => 
  import('../routes/dashboard').then(module => ({ default: module.default }))
);

// Wrapper component for lazy routes
export function LazyRoute({ Component }: { Component: React.ComponentType }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  );
}

// Preload functions for critical routes
export const preloadNaming = () => import('../routes/naming');
export const preloadDashboard = () => import('../routes/dashboard');
export const preloadSaju = () => import('../routes/saju');

// Auto-preload critical routes after initial load
if (typeof window !== 'undefined') {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  
  schedulePreload(() => {
    // Preload critical routes
    preloadNaming();
    preloadDashboard();
  });
}