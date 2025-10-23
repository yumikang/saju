import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUser } from "~/utils/user-session.server";
import { db } from "~/utils/db.server";
import {
  Calendar,
  Package,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { OrderStatus, ServiceType } from "@prisma/client";

export const meta: MetaFunction = () => {
  return [
    { title: "서비스 이용 내역 | 사주명리" },
    { name: "description", content: "나의 서비스 이용 내역을 확인하세요" },
  ];
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  NAMING: "작명 서비스",
  RENAMING: "개명 서비스",
  SAJU_COMPATIBILITY: "사주 궁합",
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  PENDING: { label: "대기중", icon: Clock, color: "text-gray-500 bg-gray-100" },
  PAID: { label: "결제완료", icon: CheckCircle2, color: "text-blue-500 bg-blue-100" },
  IN_PROGRESS: { label: "진행중", icon: Clock, color: "text-yellow-500 bg-yellow-100" },
  COMPLETED: { label: "완료", icon: CheckCircle2, color: "text-green-500 bg-green-100" },
  CANCELLED: { label: "취소됨", icon: XCircle, color: "text-red-500 bg-red-100" },
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // 서비스 주문 내역 조회
  const orders = await db.serviceOrder.findMany({
    where: {
      userId: user.id,
    },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          transactionId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // 최근 50개만
  });

  return json({ orders });
}

export default function AccountOrders() {
  const { orders } = useLoaderData<typeof loader>();

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          서비스 이용 내역이 없습니다
        </h3>
        <p className="text-gray-500 mb-6">
          아직 이용한 서비스가 없습니다. 서비스를 이용해보세요.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          서비스 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">서비스 이용 내역</h2>
        <span className="text-sm text-gray-500">
          총 {orders.length}건
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = ORDER_STATUS_CONFIG[order.status];
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={order.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 서비스 정보 */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* 주문 날짜 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(order.createdAt), "PPP", { locale: ko })}
                    </div>
                    {order.completedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        완료: {format(new Date(order.completedAt), "PPP", { locale: ko })}
                      </div>
                    )}
                  </div>

                  {/* 결제 정보 */}
                  {order.payment && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">결제금액:</span>
                      <span className="font-medium text-gray-900">
                        {order.payment.amount.toLocaleString()}원
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        {order.payment.status === "SUCCESS" ? "결제완료" : order.payment.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* 상세보기 버튼 */}
                <div className="ml-4">
                  {order.status === "COMPLETED" && order.resultData && (
                    <Link
                      to={`/naming/results/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      결과보기
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 힌트 */}
      {orders.length === 50 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          더 많은 내역을 보려면 고객센터에 문의해주세요.
        </div>
      )}
    </div>
  );
}
