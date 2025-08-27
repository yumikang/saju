import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { db } from "~/utils/db.server";
import { 
  Calendar,
  CreditCard,
  Receipt,
  ChevronLeft,
  Banknote,
  Smartphone,
  Building,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { PaymentStatusBadge } from "~/components/payment/PaymentStatusBadge";
import { Button } from "~/components/ui/button";
import { PaymentStatus, PaymentMethod, PaymentEventType } from "@prisma/client";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "결제 상세 | 사주명리" }];
  }
  return [
    { title: `결제 상세 - ${data.payment.transactionId} | 사주명리` },
    { name: "description", content: "결제 상세 정보" },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);
  const { paymentId } = params;
  
  if (!paymentId) {
    throw new Response("Payment ID is required", { status: 400 });
  }
  
  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  // 결제 상세 정보 조회 with ownership check
  const payment = await db.payment.findFirst({
    where: {
      id: paymentId,
      userId: user.id, // Ownership check
    },
    include: {
      serviceOrder: {
        select: {
          id: true,
          serviceType: true,
          status: true,
          createdAt: true,
          completedAt: true,
          price: true,
          resultData: true,
        },
      },
      paymentEvents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  
  if (!payment) {
    throw new Response("Payment not found", { status: 404 });
  }
  
  return json({ payment });
}

// Payment method helper functions
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

function getServiceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    NAMING: "작명 서비스",
    RENAMING: "개명 서비스",
    SAJU_COMPATIBILITY: "사주 궁합",
  };
  return labels[type] || type;
}

// Event type icons
function getEventTypeIcon(eventType: PaymentEventType) {
  switch (eventType) {
    case PaymentEventType.CREATED:
      return AlertCircle;
    case PaymentEventType.PENDING:
      return Clock;
    case PaymentEventType.COMPLETED:
      return CheckCircle;
    case PaymentEventType.FAILED:
      return XCircle;
    case PaymentEventType.REFUNDED:
      return RefreshCw;
    case PaymentEventType.CANCELLED:
      return XCircle;
    default:
      return AlertCircle;
  }
}

function getEventTypeLabel(eventType: PaymentEventType) {
  const labels: Record<PaymentEventType, string> = {
    [PaymentEventType.CREATED]: "결제 요청",
    [PaymentEventType.PENDING]: "처리 중",
    [PaymentEventType.COMPLETED]: "결제 완료",
    [PaymentEventType.FAILED]: "결제 실패",
    [PaymentEventType.REFUNDED]: "환불 완료",
    [PaymentEventType.CANCELLED]: "결제 취소",
  };
  return labels[eventType];
}

export default function PaymentDetail() {
  const { payment } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const MethodIcon = getPaymentMethodIcon(payment.method);
  
  // Format currency safely
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { 
      style: 'currency', 
      currency: payment.currency || 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="p-6">
      {/* Header with navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/account/payments')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          결제 내역으로 돌아가기
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">결제 상세</h2>
            <p className="text-muted-foreground mt-1">
              거래 ID: {payment.transactionId}
            </p>
          </div>
          <PaymentStatusBadge status={payment.status} />
        </div>
      </div>
      
      {/* Main payment information */}
      <div className="grid gap-6">
        {/* Payment summary card */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            결제 정보
          </h3>
          
          <div className="grid gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="text-2xl font-bold">{formatCurrency(payment.amount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">결제 수단</span>
              <div className="flex items-center gap-2">
                <MethodIcon className="h-4 w-4" />
                <span>{getPaymentMethodLabel(payment.method)}</span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">PG사</span>
              <span className="font-medium">{payment.provider}</span>
            </div>
            
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제 일시</span>
                <span>{format(new Date(payment.paidAt), 'yyyy년 M월 d일 HH:mm:ss', { locale: ko })}</span>
              </div>
            )}
            
            {payment.refundedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">환불 일시</span>
                <span className="text-blue-600">
                  {format(new Date(payment.refundedAt), 'yyyy년 M월 d일 HH:mm:ss', { locale: ko })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Service order information */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            서비스 정보
          </h3>
          
          <div className="grid gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">서비스 종류</span>
              <span className="font-medium">{getServiceTypeLabel(payment.serviceOrder.serviceType)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">서비스 가격</span>
              <span>{formatCurrency(payment.serviceOrder.price)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 생성</span>
              <span>{format(new Date(payment.serviceOrder.createdAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
            </div>
            
            {payment.serviceOrder.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">서비스 완료</span>
                <span>{format(new Date(payment.serviceOrder.completedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
              </div>
            )}
            
            {payment.serviceOrder.resultData && (
              <div className="pt-2 border-t">
                <Link to={`/account/orders/${payment.serviceOrder.id}`}>
                  <Button variant="outline" className="w-full">
                    서비스 결과 확인
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Payment events timeline */}
        {payment.paymentEvents.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              처리 내역
            </h3>
            
            <div className="space-y-3">
              {payment.paymentEvents.map((event, index) => {
                const EventIcon = getEventTypeIcon(event.eventType);
                return (
                  <div 
                    key={event.id} 
                    className={`flex gap-3 ${index !== payment.paymentEvents.length - 1 ? 'pb-3 border-b' : ''}`}
                  >
                    <EventIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{getEventTypeLabel(event.eventType)}</p>
                          {event.message && (
                            <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.createdAt), 'MM/dd HH:mm:ss', { locale: ko })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Additional metadata if exists */}
        {payment.metadata && (
          <div className="bg-gray-50 rounded-lg border p-6">
            <h3 className="font-semibold mb-4">추가 정보</h3>
            <pre className="text-sm text-muted-foreground overflow-x-auto">
              {JSON.stringify(payment.metadata, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            영수증 다운로드
          </Button>
          {payment.status === PaymentStatus.COMPLETED && !payment.refundedAt && (
            <Button variant="outline" className="flex-1">
              환불 요청
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}