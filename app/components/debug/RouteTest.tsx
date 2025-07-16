// 라우팅 디버그 컴포넌트 - 간소화
import { Link, useLocation } from "@remix-run/react";

export function RouteTest() {
  const location = useLocation();
  
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="font-bold text-sm mb-2">🔧 라우팅 디버그</h3>
      <p className="text-xs text-gray-600 mb-2">현재 경로: {location.pathname}</p>
      
      <div className="flex gap-2 flex-wrap">
        <Link 
          to="/" 
          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
        >
          홈
        </Link>
        <Link 
          to="/naming" 
          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
        >
          작명
        </Link>
        <Link 
          to="/renaming" 
          className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200"
        >
          개명
        </Link>
        <Link 
          to="/test"
          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
        >
          테스트
        </Link>
      </div>
    </div>
  );
}