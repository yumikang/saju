/**
 * Payment Fail Page
 *
 * TossPayments 결제 실패 후 리다이렉트되는 페이지
 * - URL 파라미터로 code, message를 받음
 * - 실패 원인을 사용자에게 표시
 * - 다시 시도하거나 홈으로 돌아갈 수 있는 버튼 제공
 */

import { useSearchParams, useNavigate } from '@remix-run/react';
import { Button } from '~/components/ui/button';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL 파라미터에서 실패 정보 추출
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  /**
   * 에러 코드에 따른 사용자 친화적 메시지 반환
   */
  const getUserFriendlyMessage = (errorCode: string | null): string => {
    if (!errorCode) return '알 수 없는 오류가 발생했습니다.';

    const errorMessages: Record<string, string> = {
      'PAY_PROCESS_CANCELED': '결제가 취소되었습니다.',
      'PAY_PROCESS_ABORTED': '결제가 중단되었습니다.',
      'REJECT_CARD_PAYMENT': '카드 결제가 거부되었습니다. 카드사에 문의해주세요.',
      'REJECT_CARD_COMPANY': '카드사에서 승인을 거부했습니다.',
      'INVALID_CARD_EXPIRATION': '카드 유효기간을 확인해주세요.',
      'INVALID_STOPPED_CARD': '정지된 카드입니다.',
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': '일일 결제 한도를 초과했습니다.',
      'EXCEED_MAX_ONE_TIME_PAYMENT_AMOUNT': '1회 결제 한도를 초과했습니다.',
      'NOT_SUPPORTED_CARD': '지원하지 않는 카드입니다.',
      'NOT_AVAILABLE_PAYMENT': '결제가 불가능한 상태입니다.',
      'COMMON_ERROR': '결제 중 오류가 발생했습니다.',
    };

    return errorMessages[errorCode] || message || '결제에 실패했습니다.';
  };

  const errorMessage = getUserFriendlyMessage(code);

  /**
   * 다시 시도 핸들러
   */
  const handleRetry = () => {
    // 작명 결과 페이지로 돌아가서 다시 결제 시도
    navigate('/naming-results');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        {/* 실패 아이콘 */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <svg
              className="w-16 h-16 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* 실패 메시지 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-red-600">결제 실패</h1>
          <p className="text-lg text-foreground">
            {errorMessage}
          </p>
        </div>

        {/* 에러 코드 (디버깅용) */}
        {code && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p>오류 코드: {code}</p>
            {orderId && <p>주문 ID: {orderId}</p>}
          </div>
        )}

        {/* 안내 문구 */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>결제가 완료되지 않았습니다.</p>
          <p>다시 시도하시거나, 문제가 계속되면 고객센터로 문의해주세요.</p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handleRetry}
            className="w-full"
          >
            다시 시도
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            홈으로 돌아가기
          </Button>
        </div>

        {/* 고객센터 안내 */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            문제가 지속되면 고객센터로 문의해주세요.
          </p>
          <p className="text-sm font-medium mt-1">
            이메일: support@saju-naming.com
          </p>
        </div>
      </div>
    </div>
  );
}
