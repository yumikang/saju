import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { db } from "~/utils/db.server";
import { Calendar, User, Sparkles, TrendingUp, Hash, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "작명 이력 | 사주명리" },
    { name: "description", content: "나의 작명 이력을 확인하세요" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  // 인증된 사용자만 접근 가능
  const sessionUser = await requireUser(request);
  
  // Get full user data
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  // URL에서 cursor 파라미터 가져오기 (무한 스크롤용)
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  
  // 한 번에 가져올 항목 수
  const pageSize = 20;
  
  // 커서 기반 페이지네이션으로 작명 이력 조회
  const results = await db.namingResult.findMany({
    where: {
      userId: user.id,
    },
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
    orderBy: {
      createdAt: "desc",
    },
    take: pageSize + 1, // 다음 페이지 존재 여부 확인을 위해 +1
    ...(cursor && {
      cursor: {
        id: cursor,
      },
      skip: 1, // cursor 자체는 제외
    }),
  });
  
  // 다음 페이지 존재 여부 확인
  const hasMore = results.length > pageSize;
  const resultsToReturn = hasMore ? results.slice(0, pageSize) : results;
  
  return json({
    user,
    results: resultsToReturn,
    hasMore,
    nextCursor: hasMore ? resultsToReturn[resultsToReturn.length - 1].id : null,
  });
}

export default function NamingHistory() {
  const initialData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  
  // 상태 관리
  const [results, setResults] = useState(initialData.results);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  
  // IntersectionObserver를 위한 ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // fetcher 데이터가 변경될 때 결과 업데이트
  useEffect(() => {
    if (fetcher.data) {
      setResults((prev) => [...prev, ...fetcher.data.results]);
      setHasMore(fetcher.data.hasMore);
      setNextCursor(fetcher.data.nextCursor);
      setIsLoading(false);
    }
  }, [fetcher.data]);
  
  // IntersectionObserver 설정
  useEffect(() => {
    if (!hasMore || isLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading && nextCursor) {
          setIsLoading(true);
          // cursor 파라미터와 함께 추가 데이터 로드
          fetcher.load(`/naming/history?cursor=${nextCursor}`);
        }
      },
      {
        threshold: 0.1, // 10% 보이면 트리거
        rootMargin: '100px', // 100px 전에 미리 로드
      }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoading, nextCursor, fetcher]);
  
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">작명 이력</h1>
        <p className="text-muted-foreground mt-2">
          지금까지 생성한 작명 결과를 확인하세요
        </p>
      </div>
      
      <div className="space-y-4">
        {results.length === 0 ? (
          /* 빈 상태 - 온보딩 가이드 */
          <div className="text-center py-12">
            <div className="mx-auto max-w-md">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">아직 작명 이력이 없습니다</h3>
              <p className="mt-2 text-muted-foreground">
                사주 분석을 통해 첫 작명을 시작해보세요
              </p>
              <a
                href="/naming"
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                작명 시작하기
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* 작명 결과 카드 그리드 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 카드 헤더 */}
                  <div className="flex items-start justify-between mb-4">
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

                  {/* 생성일 */}
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    {format(new Date(result.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })} 생성
                  </div>
                </div>
              ))}
            </div>

            {/* 무한 스크롤 트리거 */}
            {hasMore && (
              <div ref={loadMoreRef} className="text-center py-8">
                {isLoading || fetcher.state === "loading" ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      더 많은 결과를 불러오는 중...
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    더 많은 결과를 불러오려면 스크롤하세요
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}