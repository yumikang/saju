import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
import { requireAdmin } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

const ITEMS_PER_PAGE = 50;

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const action = url.searchParams.get("action") || undefined;
  const actorId = url.searchParams.get("actor") || undefined;
  const targetType = url.searchParams.get("target") || undefined;
  
  // Build where clause
  const where: any = {};
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (targetType) where.targetType = targetType;
  
  // Get total count
  const totalCount = await db.adminAuditLog.count({ where });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Get audit logs with pagination
  const auditLogs = await db.adminAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: { actor: true },
  });
  
  // Get unique actions for filter
  const uniqueActions = await db.adminAuditLog.findMany({
    select: { action: true },
    distinct: ["action"],
  });
  
  // Get actors for filter
  const actors = await db.user.findMany({
    where: {
      role: { in: ["ADMIN", "OPERATOR"] },
    },
    select: { id: true, email: true, name: true },
  });
  
  return json({
    user,
    auditLogs,
    pagination: {
      page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      actions: uniqueActions.map(a => a.action),
      actors,
      currentAction: action,
      currentActor: actorId,
      currentTarget: targetType,
    },
  });
}

export default function AdminAuditLog() {
  const { user, auditLogs, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page when filtering
    setSearchParams(newParams);
  };
  
  const formatMetadata = (metadata: any) => {
    if (!metadata) return "-";
    if (typeof metadata === "string") return metadata;
    return JSON.stringify(metadata, null, 2);
  };
  
  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("SUSPEND")) return "text-red-600";
    if (action.includes("CREATE") || action.includes("REGISTER")) return "text-green-600";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "text-blue-600";
    if (action.includes("LOGIN") || action.includes("LOGOUT")) return "text-purple-600";
    if (action.includes("SECURITY")) return "text-orange-600";
    return "text-gray-600";
  };
  
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
              <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
            </div>
            <div className="text-sm text-gray-600">
              전체 {pagination.totalCount}개 기록
            </div>
          </div>
        </div>
      </header>
      
      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 flex-wrap">
            <select
              value={filters.currentAction || ""}
              onChange={(e) => updateFilter("action", e.target.value || null)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="">모든 액션</option>
              {filters.actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            
            <select
              value={filters.currentActor || ""}
              onChange={(e) => updateFilter("actor", e.target.value || null)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="">모든 사용자</option>
              {filters.actors.map(actor => (
                <option key={actor.id} value={actor.id}>
                  {actor.name || actor.email}
                </option>
              ))}
            </select>
            
            <select
              value={filters.currentTarget || ""}
              onChange={(e) => updateFilter("target", e.target.value || null)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="">모든 대상</option>
              <option value="User">사용자</option>
              <option value="UserOAuth">OAuth 계정</option>
              <option value="HanjaDict">한자 사전</option>
              <option value="NamingResult">작명 결과</option>
            </select>
            
            {(filters.currentAction || filters.currentActor || filters.currentTarget) && (
              <button
                onClick={() => {
                  setSearchParams({ page: "1" });
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  액션
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  대상
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{log.actor.name || log.actor.email}</div>
                      <div className="text-xs text-gray-500">{log.actor.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.targetType && (
                      <div>
                        <div>{log.targetType}</div>
                        {log.targetId && (
                          <div className="text-xs text-gray-500">
                            {log.targetId.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.metadata && (
                      <details className="cursor-pointer">
                        <summary>보기</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {formatMetadata(log.metadata)}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                페이지 {pagination.page} / {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                {pagination.hasPrev && (
                  <Link
                    to={`?page=${pagination.page - 1}${
                      filters.currentAction ? `&action=${filters.currentAction}` : ""
                    }${
                      filters.currentActor ? `&actor=${filters.currentActor}` : ""
                    }${
                      filters.currentTarget ? `&target=${filters.currentTarget}` : ""
                    }`}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                  >
                    이전
                  </Link>
                )}
                {pagination.hasNext && (
                  <Link
                    to={`?page=${pagination.page + 1}${
                      filters.currentAction ? `&action=${filters.currentAction}` : ""
                    }${
                      filters.currentActor ? `&actor=${filters.currentActor}` : ""
                    }${
                      filters.currentTarget ? `&target=${filters.currentTarget}` : ""
                    }`}
                    className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                  >
                    다음
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}