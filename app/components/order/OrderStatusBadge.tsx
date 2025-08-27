import { OrderStatus } from "@prisma/client";
import { 
  CheckCircle,
  Loader2,
  Clock, 
  XCircle,
  CreditCard,
  type LucideIcon
} from "lucide-react";
import { cn } from "~/utils/cn";

interface OrderStatusBadgeProps {
  status: OrderStatus;
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

const statusConfig: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.COMPLETED]: {
    label: "완료",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    iconColor: "text-green-600"
  },
  [OrderStatus.IN_PROGRESS]: {
    label: "진행 중",
    icon: Loader2,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    iconColor: "text-blue-600"
  },
  [OrderStatus.PENDING]: {
    label: "대기 중",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    iconColor: "text-yellow-600"
  },
  [OrderStatus.CANCELLED]: {
    label: "취소됨",
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    iconColor: "text-gray-600"
  },
  [OrderStatus.PAID]: {
    label: "결제 완료",
    icon: CreditCard,
    className: "bg-purple-100 text-purple-800 border-purple-200",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    iconColor: "text-purple-600"
  }
};

export function OrderStatusBadge({ 
  status, 
  className,
  showIcon = true,
  showText = true
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  // 진행 중 상태일 때 아이콘 애니메이션 추가
  const iconClassName = status === OrderStatus.IN_PROGRESS 
    ? cn("h-3 w-3 animate-spin", config.iconColor)
    : cn("h-3 w-3", config.iconColor);

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
        <Icon 
          className={status === OrderStatus.IN_PROGRESS 
            ? cn("h-3.5 w-3.5 animate-spin", config.iconColor)
            : cn("h-3.5 w-3.5", config.iconColor)
          } 
          aria-hidden="true" 
        />
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
      <Icon className={iconClassName} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// 간단한 상태 색상만 반환하는 유틸리티 함수
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.COMPLETED]: "text-green-600",
    [OrderStatus.IN_PROGRESS]: "text-blue-600",
    [OrderStatus.PENDING]: "text-yellow-600",
    [OrderStatus.CANCELLED]: "text-gray-600",
    [OrderStatus.PAID]: "text-purple-600"
  };
  return colors[status];
}

// 상태별 설명 텍스트를 반환하는 유틸리티 함수
export function getOrderStatusDescription(status: OrderStatus): string {
  const descriptions: Record<OrderStatus, string> = {
    [OrderStatus.COMPLETED]: "서비스가 완료되었습니다",
    [OrderStatus.IN_PROGRESS]: "서비스가 진행 중입니다",
    [OrderStatus.PENDING]: "서비스 시작을 대기 중입니다",
    [OrderStatus.CANCELLED]: "서비스가 취소되었습니다",
    [OrderStatus.PAID]: "결제가 완료되어 서비스 준비 중입니다"
  };
  return descriptions[status];
}

// 서비스 타입별 라벨을 반환하는 유틸리티 함수
export function getServiceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    NAMING: "작명",
    RENAMING: "개명",
    SAJU_COMPATIBILITY: "사주 궁합"
  };
  return labels[type] || type;
}