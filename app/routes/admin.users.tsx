import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/utils/auth.server";
import { db } from "~/utils/db.server";

const ITEMS_PER_PAGE = 20;

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const status = url.searchParams.get("status") || "";
  
  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (status) {
    where.status = status;
  }
  
  // Get total count
  const totalCount = await db.user.count({ where });
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Get users with pagination
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    include: {
      oauthAccounts: true,
      _count: {
        select: {
          namingResults: true,
          sajuData: true,
        },
      },
    },
  });
  
  return json({
    admin,
    users,
    pagination: {
      page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    filters: {
      search,
      role,
      status,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get("_action") as string;
  const userId = formData.get("userId") as string;
  
  if (!userId) {
    return json({ error: "User ID required" }, { status: 400 });
  }
  
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return json({ error: "User not found" }, { status: 404 });
  }
  
  switch (action) {
    case "changeRole": {
      const newRole = formData.get("role") as "ADMIN" | "OPERATOR" | "VIEWER";
      
      if (!newRole) {
        return json({ error: "Role required" }, { status: 400 });
      }
      
      await db.user.update({
        where: { id: userId },
        data: { role: newRole },
      });
      
      await logAdminAction(
        admin,
        "USER_ROLE_CHANGED",
        { type: "User", id: userId },
        {
          oldRole: user.role,
          newRole,
          userEmail: user.email,
        },
        request
      );
      
      break;
    }
    
    case "changeStatus": {
      const newStatus = formData.get("status") as "ACTIVE" | "SUSPENDED";
      
      if (!newStatus) {
        return json({ error: "Status required" }, { status: 400 });
      }
      
      await db.user.update({
        where: { id: userId },
        data: { status: newStatus },
      });
      
      await logAdminAction(
        admin,
        newStatus === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
        { type: "User", id: userId },
        {
          oldStatus: user.status,
          newStatus,
          userEmail: user.email,
        },
        request
      );
      
      break;
    }
    
    case "delete": {
      // Soft delete - just mark as suspended
      await db.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });
      
      await logAdminAction(
        admin,
        "USER_DELETED",
        { type: "User", id: userId },
        { userEmail: user.email },
        request
      );
      
      break;
    }
    
    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
  
  return json({ success: true });
}

export default function AdminUsers() {
  const { admin, users, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
            <div className="text-sm text-gray-600">
              전체 {pagination.totalCount}명
            </div>
          </div>
        </div>
      </header>
      
      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4 flex-wrap items-center">
            <input
              type="text"
              placeholder="이메일 또는 이름 검색"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm w-64"
            />
            
            <select
              value={filters.role}
              onChange={(e) => updateFilter("role", e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="">모든 권한</option>
              <option value="ADMIN">관리자</option>
              <option value="OPERATOR">운영자</option>
              <option value="VIEWER">일반</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="">모든 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="SUSPENDED">정지</option>
            </select>
            
            {(filters.search || filters.role || filters.status) && (
              <button
                onClick={() => setSearchParams({ page: "1" })}
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
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  연결된 계정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  권한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  활동
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatarUrl && (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "이름 없음"}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      {user.oauthAccounts.map((oauth) => (
                        <span
                          key={oauth.id}
                          className="px-2 py-1 text-xs bg-gray-100 rounded"
                        >
                          {oauth.provider}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="changeRole" />
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        onChange={(e) => e.currentTarget.form?.submit()}
                        className="text-sm border-0 bg-transparent"
                        disabled={user.id === admin.id}
                      >
                        <option value="ADMIN">관리자</option>
                        <option value="OPERATOR">운영자</option>
                        <option value="VIEWER">일반</option>
                      </select>
                    </Form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status === "ACTIVE" ? "활성" : "정지"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>작명: {user._count.namingResults}</div>
                    <div>사주: {user._count.sajuData}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {user.status === "ACTIVE" ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="_action" value="changeStatus" />
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="SUSPENDED" />
                          <button
                            type="submit"
                            className="text-red-600 hover:text-red-800"
                            disabled={user.id === admin.id}
                            onClick={(e) => {
                              if (!confirm("이 사용자를 정지하시겠습니까?")) {
                                e.preventDefault();
                              }
                            }}
                          >
                            정지
                          </button>
                        </Form>
                      ) : (
                        <Form method="post" className="inline">
                          <input type="hidden" name="_action" value="changeStatus" />
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="status" value="ACTIVE" />
                          <button
                            type="submit"
                            className="text-green-600 hover:text-green-800"
                          >
                            활성화
                          </button>
                        </Form>
                      )}
                    </div>
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
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = pagination.page - 2 + i;
                  if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams.toString());
                        newParams.set("page", pageNum.toString());
                        setSearchParams(newParams);
                      }}
                      className={`px-3 py-1 border rounded text-sm ${
                        pageNum === pagination.page
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}