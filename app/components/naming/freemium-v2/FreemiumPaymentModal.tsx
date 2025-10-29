/**
 * FreemiumPaymentModal Component - Strategic Freemium V2
 *
 * TossPayments integration for strategic freemium naming service.
 * Optimized for 11-12위 free → 1-10위 premium conversion flow.
 *
 * Payment Flow:
 * 1. Create payment intent via /api/payment/naming
 * 2. Redirect to TossPayments checkout page
 * 3. Success → /payment/success with orderId
 * 4. Failure → /payment/fail
 *
 * Features:
 * - Clean dialog UI with payment details
 * - Strategic benefit list (10 premium names 1-10위)
 * - Score comparison emphasis
 * - Trust badges (토스페이먼츠, 환불 보장)
 * - Loading state management
 * - Error handling with toast
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import {
  Check,
  Sparkles,
  Shield,
  CreditCard,
  Lock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatAmount } from '~/lib/utils/currency';
import { toast } from 'sonner';
import type { PsychologicalMetrics } from '~/lib/freemium/classification';

export interface FreemiumPaymentModalProps {
  /** Modal open state */
  isOpen: boolean;

  /** Close modal callback */
  onClose: () => void;

  /** Session ID for freemium naming service */
  sessionId: string;

  /** Payment amount in KRW (default: 69000) */
  amount?: number;

  /** Psychological metrics for value messaging */
  metrics: PsychologicalMetrics;

  /** Customer name (optional) */
  customerName?: string;

  /** Customer email (optional) */
  customerEmail?: string;

  /** Success callback (optional) */
  onSuccess?: (orderId: string) => void;
}

/**
 * FreemiumPaymentModal Component
 */
export function FreemiumPaymentModal({
  isOpen,
  onClose,
  sessionId,
  amount = 69000,
  metrics,
  customerName,
  customerEmail,
  onSuccess,
}: FreemiumPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle payment initiation
   */
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Create payment intent
      const response = await fetch('/api/payment/naming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          amount,
          customerName,
          customerEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.error || '결제 요청 생성에 실패했습니다.'
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '결제 요청에 실패했습니다.');
      }

      // Step 2: Redirect to TossPayments checkout
      if (result.checkoutUrl) {
        // Call onSuccess callback if provided
        if (onSuccess && result.orderId) {
          onSuccess(result.orderId);
        }

        // Redirect to checkout page
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('결제 URL을 생성하지 못했습니다.');
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

  const pricePerName = Math.round(amount / 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Lock className="w-6 h-6 text-yellow-500" />
            프리미엄 이름 잠금 해제
          </DialogTitle>
          <DialogDescription className="text-base">
            1-10위 최고 점수 이름 10개를 확인하고 상세 분석을 받으세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Score comparison highlight */}
          <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-gray-900">
                지금 보신 무료 이름보다 평균 {metrics.scoreDifference}점 더 높습니다
              </span>
            </div>
            <p className="text-sm text-gray-700">
              1위 최고 점수: <strong className="text-yellow-600">{metrics.topScore}점</strong>
            </p>
          </div>

          {/* Payment details */}
          <div className="rounded-lg border-2 border-gray-200 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">사주 작명 프리미엄 결과</p>
                <p className="text-sm text-gray-600 mt-1">
                  10개 최고 점수 이름 (1-10위) + 상세 분석
                </p>
              </div>
              <Badge className="bg-yellow-500 hover:bg-yellow-600">프리미엄</Badge>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">결제 금액</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatAmount(amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    이름당 약 ₩{pricePerName.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits list */}
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
            <p className="text-sm font-bold text-emerald-900 mb-3">
              🎁 프리미엄 혜택 안내
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <div className="bg-emerald-600 rounded-full p-0.5 flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
                    1-10위 프리미엄 이름 10개 잠금 해제
                  </p>
                  <p className="text-xs text-gray-600">
                    최고 점수 {metrics.topScore}점부터 상위 10개 이름 공개
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="bg-emerald-600 rounded-full p-0.5 flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    전체 {metrics.totalCount}개 이름 + 상세 분석
                  </p>
                  <p className="text-xs text-gray-600">
                    한자 뜻, 오행 조화, 음양 균형, 수리 길흉
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="bg-emerald-600 rounded-full p-0.5 flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">평생 무제한 열람</p>
                  <p className="text-xs text-gray-600">
                    언제든 다시 확인하고 가족과 상의 가능
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <div className="bg-emerald-600 rounded-full p-0.5 flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">PDF 내보내기 & 즐겨찾기</p>
                  <p className="text-xs text-gray-600">결과를 저장하고 공유</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isProcessing ? '처리 중...' : `${formatAmount(amount)} 결제하기`}
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 pt-2">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>토스페이먼츠 안전결제</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              <span>100% 환불 보장</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>1회 결제 평생 이용</span>
            </div>
          </div>

          {/* Security notice */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-900">
              모든 결제는 토스페이먼츠를 통해 안전하게 처리되며,
              개인정보는 암호화되어 보호됩니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
