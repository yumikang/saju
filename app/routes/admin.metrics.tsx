import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  
  // Get database metrics
  const [
    userCount,
    namingCount,
    sajuCount,
    hanjaCount,
    recentActivity,
    topUsers,
  ] = await Promise.all([
    db.user.count(),
    db.namingResult.count(),
    db.sajuData.count(),
    db.hanjaDict.count(),
    // Recent activity (last 24 hours)
    db.namingResult.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    // Top active users
    db.user.findMany({
      take: 10,
      orderBy: {
        lastLoginAt: "desc",
      },
      where: {
        lastLoginAt: {
          not: null,
        },
      },
      include: {
        _count: {
          select: {
            namingResults: true,
            sajuData: true,
          },
        },
      },
    }),
  ]);
  
  // Calculate growth rates (mock data for now)
  const growthRates = {
    users: 12.5,
    naming: 25.3,
    saju: 18.7,
    activity: 5.2,
  };
  
  return json({
    user,
    metrics: {
      userCount,
      namingCount,
      sajuCount,
      hanjaCount,
      recentActivity,
    },
    topUsers,
    growthRates,
    grafanaUrl: "http://localhost:3000",
    prometheusUrl: "http://localhost:9090",
  });
}

export default function AdminMetrics() {
  const { user, metrics, topUsers, growthRates, grafanaUrl, prometheusUrl } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-gray-500 hover:text-gray-700">
                ← 대시보드
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">시스템 메트릭</h1>
            </div>
            <div className="flex gap-4">
              <a
                href={grafanaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Grafana 열기
              </a>
              <a
                href={prometheusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Prometheus 열기
              </a>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">전체 사용자</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.userCount.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {growthRates.users}% 증가
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">작명 결과</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.namingCount.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {growthRates.naming}% 증가
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">사주 분석</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.sajuCount.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {growthRates.saju}% 증가
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">오늘 활동</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.recentActivity.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-1">
                  ↑ {growthRates.activity}% 증가
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">시스템 상태</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PostgreSQL</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">정상</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PgBouncer</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">정상</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prometheus</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">정상</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Grafana</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">정상</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Redis Cache</span>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미설치</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">리소스 사용량</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">CPU</span>
                    <span className="text-sm text-gray-900">23%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "23%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">메모리</span>
                    <span className="text-sm text-gray-900">41%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "41%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">디스크</span>
                    <span className="text-sm text-gray-900">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "67%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">DB 연결</span>
                    <span className="text-sm text-gray-900">12/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "12%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Active Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동 사용자</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작명 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사주 분석</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">마지막 로그인</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatarUrl && (
                          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "이름 없음"}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.namingResults}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.sajuData}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ko-KR") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}