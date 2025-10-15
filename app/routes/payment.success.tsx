/**
 * Payment Success Page
 *
 * TossPayments 결제 성공 후 리다이렉트되는 페이지
 * - URL 파라미터로 paymentKey, orderId, amount를 받음
 * - /api/payment/confirm을 호출하여 결제 승인
 * - 성공 시 작명 결과 페이지로 이동
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const confirmPayment = async () => {
      // URL 파라미터 추출
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      // 필수 파라미터 검증
      if (!paymentKey || !orderId || !amount) {
        setStatus('error');
        setErrorMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        // /api/payment/confirm 호출
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '결제 승인에 실패했습니다.');
        }

        const data = await response.json();

        // 성공 처리
        setStatus('success');
        toast.success('결제가 완료되었습니다!');

        // 3초 후 작명 결과 페이지로 이동
        setTimeout(() => {
          // sajuId를 추출하여 결과 페이지로 이동
          // (orderId에서 sajuId를 추출하거나, 별도로 전달받아야 함)
          navigate('/naming-results');
        }, 3000);
      } catch (error: any) {
        console.error('Payment confirmation error:', error);
        setStatus('error');
        setErrorMessage(error.message || '결제 승인에 실패했습니다.');
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  // 확인 중 상태
  if (status === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          {/* 로딩 스피너 */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">결제 확인 중...</h1>
            <p className="text-muted-foreground">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 성공 상태
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          {/* 성공 아이콘 */}
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-green-600">결제 완료!</h1>
            <p className="text-muted-foreground">
              결제가 성공적으로 완료되었습니다.
              <br />
              곧 작명 결과 페이지로 이동합니다.
            </p>
          </div>

          <Button
            onClick={() => navigate('/naming-results')}
            className="w-full"
          >
            결과 페이지로 이동
          </Button>
        </div>
      </div>
    );
  }

  // 에러 상태
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        {/* 에러 아이콘 */}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-red-600">결제 승인 실패</h1>
          <p className="text-muted-foreground">
            {errorMessage || '결제 승인 중 문제가 발생했습니다.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            홈으로
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
