import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link, useNavigate } from "@remix-run/react";
import { requireUserProfile } from "~/utils/user-auth.server";
import { db } from "~/utils/db.server";
import { Calendar, User, Sparkles, TrendingUp, Hash, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const meta: MetaFunction = () => {
  return [
    { title: "즐겨찾기 | 사주명리" },
    { name: "description", content: "즐겨찾기한 작명 결과를 관리하세요" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // 인증된 사용자만 접근 가능 (프로필 및 약관 동의 완료 필수)
  const user = await requireUserProfile(request);
  
  // URL 파라미터 처리
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const sort = url.searchParams.get("sort") || "recent";
  
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  
  // 정렬 옵션 설정
  let orderBy: any = {};
  switch (sort) {
    case "popular":
      // rating이 높은 순으로 정렬 (rating이 null인 경우도 고려)
      orderBy = { rating: "desc" };
      break;
    case "strokes":
      // 획수가 많은 순으로 정렬
      orderBy = { namingResult: { totalStrokes: "desc" } };
      break;
    case "recent":
    default:
      // 최근 추가한 순으로 정렬
      orderBy = { createdAt: "desc" };
      break;
  }
  
  // 전체 개수 조회
  const totalCount = await db.favorite.count({
    where: { userId: user.id },
  });
  
  // 즐겨찾기 목록 조회
  const favorites = await db.favorite.findMany({
    where: { userId: user.id },
    include: {
      namingResult: {
        include: {
          sajuData: {
            select: {
              name: true,
              birthDate: true,
              gender: true,
              isLunar: true,
            },
          },
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  });
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return json({
    user,
    favorites,
    totalCount,
    currentPage: page,
    totalPages,
    sort,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  // 인증된 사용자만 접근 가능
  const user = await requireUserProfile(request);
  
  const formData = await request.formData();
  const namingResultId = formData.get("namingResultId") as string;
  const method = request.method;
  
  if (!namingResultId) {
    return json({ error: "작명 결과 ID가 필요합니다." }, { status: 400 });
  }
  
  try {
    if (method === "POST") {
      // 즐겨찾기 추가
      // 먼저 해당 작명 결과가 사용자 소유인지 확인
      const namingResult = await db.namingResult.findFirst({
        where: {
          id: namingResultId,
          userId: user.id,
        },
      });
      
      if (!namingResult) {
        return json({ error: "작명 결과를 찾을 수 없습니다." }, { status: 404 });
      }
      
      // 이미 즐겨찾기에 있는지 확인
      const existingFavorite = await db.favorite.findUnique({
        where: {
          userId_namingResultId: {
            userId: user.id,
            namingResultId,
          },
        },
      });
      
      if (existingFavorite) {
        return json({ error: "이미 즐겨찾기에 추가되어 있습니다." }, { status: 400 });
      }
      
      // 즐겨찾기 추가
      await db.favorite.create({
        data: {
          userId: user.id,
          namingResultId,
        },
      });
      
      return json({ success: true, message: "즐겨찾기에 추가되었습니다." });
      
    } else if (method === "DELETE") {
      // 즐겨찾기 제거
      const deleted = await db.favorite.deleteMany({
        where: {
          userId: user.id,
          namingResultId,
        },
      });
      
      if (deleted.count === 0) {
        return json({ error: "즐겨찾기를 찾을 수 없습니다." }, { status: 404 });
      }
      
      return json({ success: true, message: "즐겨찾기에서 제거되었습니다." });
    }
    
    return json({ error: "지원하지 않는 메소드입니다." }, { status: 405 });
    
  } catch (error) {
    console.error("즐겨찾기 처리 오류:", error);
    return json({ error: "즐겨찾기 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export default function NamingFavorites() {
  const { user, favorites, totalCount, currentPage, totalPages, sort } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  
  // 정렬 옵션 변경 핸들러
  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams();
    params.set("sort", newSort);
    if (currentPage > 1) params.set("page", String(currentPage));
    navigate(`?${params.toString()}`);
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (sort !== "recent") params.set("sort", sort);
    params.set("page", String(page));
    navigate(`?${params.toString()}`);
  };
  
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">즐겨찾기</h1>
          <p className="text-muted-foreground mt-2">
            마음에 드는 작명 결과를 모아보세요 ({totalCount}개)
          </p>
        </div>
        
        {/* 정렬 옵션 */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted-foreground">
              정렬:
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="recent">최근 추가순</option>
              <option value="popular">인기순</option>
              <option value="strokes">획수순</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <Star className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">아직 즐겨찾기가 없습니다</h3>
              <p className="mt-2 text-muted-foreground">
                작명 결과에서 별표를 눌러 즐겨찾기에 추가하세요
              </p>
              <Link
                to="/naming/history"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                작명 이력 보기
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 즐겨찾기 카드 그리드 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => {
                const result = favorite.namingResult;
                return (
                  <div
                    key={favorite.id}
                    className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    {/* 즐겨찾기 토글 버튼 */}
                    <fetcher.Form method="delete" className="absolute top-4 right-4">
                      <input type="hidden" name="namingResultId" value={result.id} />
                      <button
                        type="submit"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        title="즐겨찾기 제거"
                      >
                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      </button>
                    </fetcher.Form>
                    
                    {/* 카드 헤더 */}
                    <div className="flex items-start justify-between mb-4 pr-8">
                      <div>
                        <h3 className="text-xl font-bold">{result.fullName}</h3>
                        {result.lastNameHanja && result.firstNameHanja && (
                          <p className="text-lg text-muted-foreground mt-1">
                            {result.lastNameHanja}{result.firstNameHanja}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(result.overallScore)}
                        </div>
                        <div className="text-xs text-muted-foreground">종합점수</div>
                      </div>
                    </div>

                    {/* 점수 정보 */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="font-medium">{Math.round(result.balanceScore)}</div>
                        <div className="text-xs text-muted-foreground">균형</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <Sparkles className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="font-medium">{Math.round(result.soundScore)}</div>
                        <div className="text-xs text-muted-foreground">음향</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <Hash className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="font-medium">{result.totalStrokes}</div>
                        <div className="text-xs text-muted-foreground">획수</div>
                      </div>
                    </div>

                    {/* 사주 정보 */}
                    {result.sajuData && (
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{result.sajuData.name}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{result.sajuData.gender === 'M' ? '남' : '여'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(result.sajuData.birthDate), 'yyyy년 M월 d일', { locale: ko })}
                            {result.sajuData.isLunar && ' (음력)'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 평점 및 추가일 */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                      <div>
                        {favorite.rating && (
                          <span>평점: {favorite.rating}/5</span>
                        )}
                      </div>
                      <div>
                        {format(new Date(favorite.createdAt), 'yyyy.MM.dd', { locale: ko })} 추가
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // 현재 페이지 주변 2개와 첫/마지막 페이지만 표시
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-md text-sm transition-colors ${
                            page === currentPage
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}