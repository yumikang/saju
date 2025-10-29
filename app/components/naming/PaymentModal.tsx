/**
 * PaymentModal Component
 *
 * TossPayments SDK를 사용한 결제 모달
 * - 결제 Intent 생성 (/api/payment/intent)
 * - TossPayments 결제창 호출
 * - 성공/실패 페이지로 리다이렉트
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { formatAmount } from '~/lib/payment/toss.client';
import { requestPayment } from '~/lib/payment/toss.client';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sajuId?: string; // Legacy flow (optional)
  sessionId?: string; // Freemium flow (optional)
  amount: number; // 결제 금액 (원 단위)
  userName?: string;
  userEmail?: string;
  onSuccess?: (paymentId: string) => void; // Callback for success
}

export function PaymentModal({
  isOpen,
  onClose,
  sajuId,
  sessionId,
  amount,
  userName,
  userEmail,
  onSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 결제 시작 핸들러
   */
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Determine which payment API to use
      const isFreemiumFlow = !!sessionId;
      const apiEndpoint = isFreemiumFlow ? '/api/payment/naming' : '/api/payment/intent';

      // Step 1: Create payment request
      const requestBody = isFreemiumFlow
        ? { sessionId, amount, customerName: userName, customerEmail: userEmail }
        : { sajuId, amount };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || '결제 요청 생성에 실패했습니다.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '결제 요청에 실패했습니다.');
      }

      // Step 2: Redirect to TossPayments checkout page
      if (isFreemiumFlow && result.checkoutUrl) {
        // Freemium flow: Redirect to TossPayments checkout
        window.location.href = result.checkoutUrl;
      } else {
        // Legacy flow: Use TossPayments SDK
        const currentUrl = window.location.origin;
        await requestPayment({
          amount,
          orderId: result.orderId,
          orderName: '사주 작명 결과 프리미엄 조회',
          customerName: userName,
          customerEmail: userEmail,
          successUrl: `${currentUrl}/payment/success`,
          failUrl: `${currentUrl}/payment/fail`,
        });
      }

      // Close modal
      onClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || '결제 요청에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프리미엄 결제</DialogTitle>
          <DialogDescription>
            전체 작명 결과와 상세 분석을 확인하려면 결제가 필요합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 결제 정보 */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">상품명</span>
              <span className="font-medium">사주 작명 결과 프리미엄 조회</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">결제 금액</span>
              <span className="text-lg font-bold text-primary">
                {formatAmount(amount)}
              </span>
            </div>
          </div>

          {/* 혜택 안내 */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">프리미엄 혜택 (전략적 freemium)</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 더 높은 점수의 이름 추천 9개 조회 및 상세 분석</li>
              <li>✓ PDF 다운로드 가능</li>
            </ul>
          </div>

          {/* 결제 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? '처리 중...' : `${formatAmount(amount)} 결제하기`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
