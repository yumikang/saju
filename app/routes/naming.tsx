/**
 * Naming Service Layout Route
 *
 * Provides consistent layout for all naming flow pages.
 * Integrates with Phase 2 APIs for saju analysis and name recommendations.
 */

import { Link, Outlet, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { HomeIcon } from 'lucide-react';

/**
 * Layout component with consistent header/footer and Outlet for nested routes
 */
export default function NamingLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <NamingHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Header component with navigation
 */
function NamingHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-orange-100">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <Link to="/naming" className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              사주 작명
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/naming/favorites"
              className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              즐겨찾기
            </Link>
            <Link
              to="/naming/history"
              className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              이전 분석
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}


/**
 * Error Boundary
 *
 * Handles errors gracefully with user-friendly Korean messages
 */
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <NamingHeader />
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-orange-600">
              {error.status}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {error.status === 404 ? '페이지를 찾을 수 없습니다' : '오류가 발생했습니다'}
            </h1>
            <p className="text-lg text-gray-600">
              {error.data || '요청하신 페이지를 처리할 수 없습니다.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="default">
                <Link to="/naming">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  처음으로 돌아가기
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Unknown error
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <NamingHeader />
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center space-y-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900">
            예상치 못한 오류가 발생했습니다
          </h1>
          <p className="text-lg text-gray-600">
            잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="default">
              <Link to="/naming">
                <HomeIcon className="mr-2 h-4 w-4" />
                처음으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
