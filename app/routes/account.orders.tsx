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
  FileText,
  Lock,
  Unlock
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const meta: MetaFunction = () => {
  return [
    { title: "서비스 이용 내역 | 사주명리" },
    { name: "description", content: "나의 서비스 이용 내역을 확인하세요" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const sessionUser = await requireUser(request);

  const user = await db.user.findUnique({
    where: { id: sessionUser.userId },
  });

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  // Freemium 작명 세션 내역 조회
  const sessions = await db.namingSession.findMany({
    where: {
      payment: {
        userId: user.id,
      },
    },
    include: {
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          method: true,
          unlocked: true,
          requestedAt: true,
          approvedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // 최근 50개만
  });

  return json({ sessions });
}

export default function AccountOrders() {
  const { sessions } = useLoaderData<typeof loader>();

  if (sessions.length === 0) {
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
          to="/naming/freemium"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
        >
          작명 서비스 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">서비스 이용 내역</h2>
        <span className="text-sm text-gray-500">
          총 {sessions.length}건
        </span>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          const isUnlocked = session.payment?.unlocked || false;
          const StatusIcon = isUnlocked ? Unlock : Lock;
          const statusColor = isUnlocked
            ? "text-green-500 bg-green-100"
            : "text-gray-500 bg-gray-100";

          return (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 서비스 정보 */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {session.lastName}
                      {session.gender === "M" ? "남아" : "여아"} 작명
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {isUnlocked ? "프리미엄 잠금 해제" : "무료 체험"}
                    </span>
                  </div>

                  {/* 세션 날짜 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(session.createdAt), "PPP", { locale: ko })}
                    </div>
                    {session.payment?.approvedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        결제: {format(new Date(session.payment.approvedAt), "PPP", { locale: ko })}
                      </div>
                    )}
                  </div>

                  {/* 결제 정보 */}
                  {session.payment && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">결제금액:</span>
                      <span className="font-medium text-gray-900">
                        {session.payment.amount.toLocaleString()}원
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        {session.payment.status === "DONE" ? "결제완료" : session.payment.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* 상세보기 버튼 */}
                <div className="ml-4">
                  <Link
                    to={`/naming/freemium/result?sessionId=${session.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    결과보기
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 힌트 */}
      {sessions.length === 50 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          더 많은 내역을 보려면 고객센터에 문의해주세요.
        </div>
      )}
    </div>
  );
}
