import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { db } from "~/utils/db.server";
import { 
  Calendar, 
  CreditCard, 
  Receipt,
  Filter,
  ChevronRight,
  Loader2,
  Banknote,
  Smartphone,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { PaymentStatusBadge } from "~/components/payment/PaymentStatusBadge";
import { Button } from "~/components/ui/button";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export const meta: MetaFunction = () => {
  return [
    { title: "결제 내역 | 사주명리" },
    { name: "description", content: "나의 결제 내역을 확인하세요" },
  ];
};

// Helper function to serialize cursor for safer pagination
function encodeCursor(payment: { id: string; createdAt: Date }): string {
  return Buffer.from(
    JSON.stringify({ id: payment.id, createdAt: payment.createdAt.toISOString() })
  ).toString('base64');
}

function decodeCursor(cursor: string): { id: string; createdAt: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  // URL에서 필터와 cursor 파라미터 가져오기
  const url = new URL(request.url);
  const cursorParam = url.searchParams.get("cursor");
  const statusFilter = url.searchParams.get("status") as PaymentStatus | null;
  
  // 기간 필터 (기본값: 최근 90일)
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultFromDate.getDate() - 90);
  
  const pageSize = 20;
  
  // Decode cursor if provided
  const decodedCursor = cursorParam ? decodeCursor(cursorParam) : null;
  
  // 결제 내역 조회 - 보조 정렬키 추가로 안정성 확보
  const payments = await db.payment.findMany({
    where: {
      userId: user.id,
      ...(statusFilter && { status: statusFilter }),
      createdAt: {
        gte: fromDate ? new Date(fromDate) : defaultFromDate,
        ...(toDate && { lte: new Date(toDate) }),
      },
      // Add cursor-based filtering for stable pagination
      ...(decodedCursor && {
        OR: [
          { createdAt: { lt: new Date(decodedCursor.createdAt) } },
          {
            createdAt: new Date(decodedCursor.createdAt),
            id: { lt: decodedCursor.id },
          },
        ],
      }),
    },
    include: {
      serviceOrder: {
        select: {
          id: true,
          serviceType: true,
          status: true,
        },
      },
      paymentEvents: {
        orderBy: { createdAt: "desc" },
        take: 5, // 최근 5개 이벤트만
      },
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" }, // 보조 정렬키로 순서 보장
    ],
    take: pageSize + 1,
  });
  
  const hasMore = payments.length > pageSize;
  const paymentsToReturn = hasMore ? payments.slice(0, pageSize) : payments;
  
  // 통계 정보 계산
  const stats = await db.payment.aggregate({
    where: {
      userId: user.id,
      status: PaymentStatus.COMPLETED,
    },
    _sum: {
      amount: true,
    },
    _count: {
      _all: true,
    },
  });
  
  // Set cache headers for first page
  const headers = new Headers();
  if (!cursorParam && !statusFilter) {
    headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
  }
  
  return json({
    user,
    payments: paymentsToReturn,
    hasMore,
    nextCursor: hasMore ? encodeCursor(paymentsToReturn[paymentsToReturn.length - 1]) : null,
    stats: {
      totalAmount: stats._sum.amount || 0,
      totalCount: stats._count._all,
    },
    currentFilter: statusFilter,
    dateRange: {
      from: fromDate || defaultFromDate.toISOString(),
      to: toDate || new Date().toISOString(),
    },
  }, { headers });
}

// 결제 수단 아이콘 반환
function getPaymentMethodIcon(method: PaymentMethod) {
  switch (method) {
    case PaymentMethod.CARD:
      return CreditCard;
    case PaymentMethod.BANK_TRANSFER:
      return Building;
    case PaymentMethod.KAKAO_PAY:
    case PaymentMethod.NAVER_PAY:
    case PaymentMethod.TOSS:
      return Smartphone;
    default:
      return Banknote;
  }
}

// 결제 수단 라벨 반환
function getPaymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    [PaymentMethod.CARD]: "신용/체크카드",
    [PaymentMethod.BANK_TRANSFER]: "계좌이체",
    [PaymentMethod.KAKAO_PAY]: "카카오페이",
    [PaymentMethod.NAVER_PAY]: "네이버페이",
    [PaymentMethod.TOSS]: "토스",
  };
  return labels[method];
}

// 서비스 타입 라벨 반환
function getServiceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    NAMING: "작명 서비스",
    RENAMING: "개명 서비스",
    SAJU_COMPATIBILITY: "사주 궁합",
  };
  return labels[type] || type;
}

export default function PaymentHistory() {
  const initialData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof loader>();
  
  const [payments, setPayments] = useState(initialData.payments);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [selectedPayment, setSelectedPayment] = useState<typeof payments[0] | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // fetcher 데이터 업데이트
  useEffect(() => {
    if (fetcher.data) {
      setPayments((prev) => [...prev, ...fetcher.data.payments]);
      setHasMore(fetcher.data.hasMore);
      setNextCursor(fetcher.data.nextCursor);
      setIsLoading(false);
    }
  }, [fetcher.data]);
  
  // 무한 스크롤 설정
  useEffect(() => {
    if (!hasMore || isLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading && nextCursor) {
          setIsLoading(true);
          const params = new URLSearchParams();
          params.append("cursor", nextCursor);
          if (initialData.currentFilter) {
            params.append("status", initialData.currentFilter);
          }
          fetcher.load(`/account/payments?${params.toString()}`);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, isLoading, nextCursor, fetcher, initialData.currentFilter]);
  
  // 영수증 모달 열기
  const openReceipt = (payment: typeof payments[0]) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };
  
  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold">결제 내역</h2>
        <p className="text-muted-foreground mt-1">
          서비스 이용에 대한 모든 결제 내역을 확인하세요
        </p>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">총 결제 금액</p>
              <p className="text-2xl font-bold text-blue-900">
                {new Intl.NumberFormat('ko-KR', { 
                  style: 'currency', 
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(initialData.stats.totalAmount)}
              </p>
            </div>
            <Banknote className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">결제 횟수</p>
              <p className="text-2xl font-bold text-green-900">
                {initialData.stats.totalCount}회
              </p>
            </div>
            <Receipt className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
      
      {/* 필터 버튼들 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <a href="/account/payments">
          <Button 
            variant={!initialData.currentFilter ? "default" : "outline"}
            size="sm"
          >
            전체
          </Button>
        </a>
        <a href="/account/payments?status=COMPLETED">
          <Button 
            variant={initialData.currentFilter === PaymentStatus.COMPLETED ? "default" : "outline"}
            size="sm"
          >
            결제 완료
          </Button>
        </a>
        <a href="/account/payments?status=PENDING">
          <Button 
            variant={initialData.currentFilter === PaymentStatus.PENDING ? "default" : "outline"}
            size="sm"
          >
            대기 중
          </Button>
        </a>
        <a href="/account/payments?status=REFUNDED">
          <Button 
            variant={initialData.currentFilter === PaymentStatus.REFUNDED ? "default" : "outline"}
            size="sm"
          >
            환불
          </Button>
        </a>
      </div>
      
      {/* 결제 내역 리스트 */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">결제 내역이 없습니다</h3>
            <p className="mt-2 text-muted-foreground">
              서비스를 이용하시면 결제 내역이 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <>
            {payments.map((payment) => {
              const MethodIcon = getPaymentMethodIcon(payment.method);
              
              return (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <PaymentStatusBadge status={payment.status} />
                        <span className="text-sm font-medium">
                          {getServiceTypeLabel(payment.serviceOrder.serviceType)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {payment.paidAt
                              ? format(new Date(payment.paidAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })
                              : format(new Date(payment.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4" />
                          <span>{getPaymentMethodLabel(payment.method)}</span>
                        </div>
                      </div>
                      
                      {payment.status === PaymentStatus.REFUNDED && payment.refundedAt && (
                        <div className="mt-2 text-sm text-blue-600">
                          환불일: {format(new Date(payment.refundedAt), 'yyyy년 M월 d일', { locale: ko })}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat('ko-KR', { 
                  style: 'currency', 
                  currency: 'KRW',
                  maximumFractionDigits: 0,
                }).format(payment.amount)}
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          onClick={() => openReceipt(payment)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          영수증
                        </button>
                        <span className="text-muted-foreground">·</span>
                        <Link
                          to={`/account/payments/${payment.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          상세 <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 무한 스크롤 트리거 */}
            {hasMore && (
              <div ref={loadMoreRef} className="text-center py-8">
                {isLoading || fetcher.state === "loading" ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      더 많은 결제 내역을 불러오는 중...
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    더 많은 결제 내역을 불러오려면 스크롤하세요
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 영수증 모달 */}
      {showReceiptModal && selectedPayment && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">전자 영수증</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">거래 ID</p>
                <p className="font-mono text-sm">{selectedPayment.transactionId}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">서비스</p>
                <p className="font-medium">
                  {getServiceTypeLabel(selectedPayment.serviceOrder.serviceType)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">결제 금액</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('ko-KR', { 
                    style: 'currency', 
                    currency: 'KRW',
                    maximumFractionDigits: 0,
                  }).format(selectedPayment.amount)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">결제 수단</p>
                <p>{getPaymentMethodLabel(selectedPayment.method)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">결제 일시</p>
                <p>
                  {selectedPayment.paidAt
                    ? format(new Date(selectedPayment.paidAt), 'yyyy년 M월 d일 HH:mm:ss', { locale: ko })
                    : '-'}
                </p>
              </div>
              
              {selectedPayment.paymentEvents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">처리 내역</p>
                  <div className="space-y-1">
                    {selectedPayment.paymentEvents.map((event) => (
                      <div key={event.id} className="text-xs text-muted-foreground">
                        {format(new Date(event.createdAt), 'MM/dd HH:mm', { locale: ko })} - {event.message || event.eventType}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}