import { PaymentStatus } from "@prisma/client";
import { 
  Check, 
  Clock, 
  X, 
  RotateCcw, 
  Ban,
  type LucideIcon
} from "lucide-react";
import { cn } from "~/utils/cn";

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

const statusConfig: Record<PaymentStatus, StatusConfig> = {
  [PaymentStatus.COMPLETED]: {
    label: "결제 완료",
    icon: Check,
    className: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    iconColor: "text-green-600"
  },
  [PaymentStatus.PENDING]: {
    label: "결제 대기",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    iconColor: "text-yellow-600"
  },
  [PaymentStatus.FAILED]: {
    label: "결제 실패",
    icon: X,
    className: "bg-red-100 text-red-800 border-red-200",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    iconColor: "text-red-600"
  },
  [PaymentStatus.REFUNDED]: {
    label: "환불 완료",
    icon: RotateCcw,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    iconColor: "text-blue-600"
  },
  [PaymentStatus.CANCELLED]: {
    label: "결제 취소",
    icon: Ban,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    iconColor: "text-gray-600"
  }
};

export function PaymentStatusBadge({ 
  status, 
  className,
  showIcon = true,
  showText = true
}: PaymentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // 아이콘만 표시하는 경우
  if (showIcon && !showText) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5",
          config.bgColor,
          className
        )}
        title={config.label}
        aria-label={config.label}
      >
        <Icon className={cn("h-3.5 w-3.5", config.iconColor)} aria-hidden="true" />
      </div>
    );
  }

  // 텍스트만 표시하는 경우
  if (!showIcon && showText) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
          config.className,
          className
        )}
      >
        {config.label}
      </span>
    );
  }

  // 아이콘과 텍스트 모두 표시 (기본값)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// 간단한 상태 색상만 반환하는 유틸리티 함수
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    [PaymentStatus.COMPLETED]: "text-green-600",
    [PaymentStatus.PENDING]: "text-yellow-600",
    [PaymentStatus.FAILED]: "text-red-600",
    [PaymentStatus.REFUNDED]: "text-blue-600",
    [PaymentStatus.CANCELLED]: "text-gray-600"
  };
  return colors[status];
}

// 상태별 설명 텍스트를 반환하는 유틸리티 함수
export function getPaymentStatusDescription(status: PaymentStatus): string {
  const descriptions: Record<PaymentStatus, string> = {
    [PaymentStatus.COMPLETED]: "결제가 성공적으로 완료되었습니다",
    [PaymentStatus.PENDING]: "결제 승인을 기다리고 있습니다",
    [PaymentStatus.FAILED]: "결제 처리 중 오류가 발생했습니다",
    [PaymentStatus.REFUNDED]: "결제 금액이 환불되었습니다",
    [PaymentStatus.CANCELLED]: "결제가 취소되었습니다"
  };
  return descriptions[status];
}