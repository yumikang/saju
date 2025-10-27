/**
 * AI Naming Service Layout Route
 *
 * NamingPipeline (8-step) 전용 레이아웃
 * 기존 /naming과 독립적인 새로운 작명 서비스
 */

import { Link, Outlet, useRouteError, isRouteErrorResponse } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { HomeIcon } from 'lucide-react';

/**
 * Layout component with AI branding
 */
export default function AINamingLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-white">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>
      <AINamingFooter />
    </div>
  );
}

/**
 * Footer
 */
function AINamingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© 2025 AI 사주 작명 서비스. Powered by NamingPipeline v3.0</p>
          <div className="flex gap-6">
            <Link to="/about" className="hover:text-purple-600 transition-colors">
              서비스 소개
            </Link>
            <Link to="/privacy" className="hover:text-purple-600 transition-colors">
              개인정보처리방침
            </Link>
            <Link to="/terms" className="hover:text-purple-600 transition-colors">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Error Boundary
 */
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-purple-600">
              {error.status}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {error.status === 404 ? '페이지를 찾을 수 없습니다' : '오류가 발생했습니다'}
            </h1>
            <p className="text-lg text-gray-600">
              {error.data || '요청하신 페이지를 처리할 수 없습니다.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="default" className="bg-purple-600 hover:bg-purple-700">
                <Link to="/ai-naming">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  처음으로 돌아가기
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <AINamingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
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
            <Button asChild variant="default" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/ai-naming">
                <HomeIcon className="mr-2 h-4 w-4" />
                처음으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <AINamingFooter />
    </div>
  );
}
