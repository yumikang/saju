import { motion, AnimatePresence } from 'framer-motion';
import { Battery, BatteryCharging, BatteryLow, Zap, WifiOff, Eye, EyeOff } from 'lucide-react';
import { useOptimizedSocket } from '~/hooks/useOptimizedSocket';
import { cn } from '~/lib/utils';

/**
 * 배터리 상태 표시 컴포넌트
 * 모바일 기기의 배터리 상태와 최적화 모드를 표시
 */
export function BatteryStatus() {
  const {
    batteryStatus,
    optimizationMode,
    batterySavingTips,
    isConnected,
    metrics
  } = useOptimizedSocket({
    enableBatteryOptimization: true,
    enableLogging: true
  });

  if (!batteryStatus) {
    return null; // Battery API를 지원하지 않는 경우
  }

  const batteryPercentage = Math.round(batteryStatus.level * 100);
  const isLowBattery = batteryPercentage <= 20;
  const isCriticalBattery = batteryPercentage <= 10;

  // 배터리 아이콘 선택
  const BatteryIcon = batteryStatus.charging 
    ? BatteryCharging 
    : isCriticalBattery 
      ? BatteryLow 
      : Battery;

  // 배터리 레벨에 따른 색상
  const batteryColor = batteryStatus.charging
    ? 'text-green-600'
    : isCriticalBattery
      ? 'text-red-600'
      : isLowBattery
        ? 'text-yellow-600'
        : 'text-gray-600';

  const batteryBgColor = batteryStatus.charging
    ? 'bg-green-100'
    : isCriticalBattery
      ? 'bg-red-100'
      : isLowBattery
        ? 'bg-yellow-100'
        : 'bg-gray-100';

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]"
      >
        {/* 배터리 상태 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full",
              batteryBgColor
            )}>
              <BatteryIcon className={cn("w-5 h-5", batteryColor)} />
            </div>
            <div>
              <div className="text-lg font-bold">{batteryPercentage}%</div>
              <div className="text-xs text-muted-foreground">
                {batteryStatus.charging ? '충전 중' : '배터리 사용 중'}
              </div>
            </div>
          </div>
          
          {/* 최적화 모드 배지 */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            optimizationMode === 'charging' && "bg-green-100 text-green-800",
            optimizationMode === 'normal' && "bg-blue-100 text-blue-800",
            optimizationMode === 'low-power' && "bg-yellow-100 text-yellow-800",
            optimizationMode === 'critical' && "bg-red-100 text-red-800"
          )}>
            {optimizationMode === 'charging' && '최적 성능'}
            {optimizationMode === 'normal' && '일반 모드'}
            {optimizationMode === 'low-power' && '절전 모드'}
            {optimizationMode === 'critical' && '긴급 모드'}
          </div>
        </div>

        {/* 배터리 진행 바 */}
        <div className="mb-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                batteryStatus.charging && "bg-green-500",
                !batteryStatus.charging && batteryPercentage > 50 && "bg-blue-500",
                !batteryStatus.charging && batteryPercentage <= 50 && batteryPercentage > 20 && "bg-yellow-500",
                !batteryStatus.charging && batteryPercentage <= 20 && "bg-red-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${batteryPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* 충전 시간 정보 */}
        {batteryStatus.charging && batteryStatus.chargingTime && (
          <div className="text-xs text-muted-foreground mb-2">
            완충까지 약 {Math.round(batteryStatus.chargingTime / 60)}분
          </div>
        )}

        {/* 방전 시간 정보 */}
        {!batteryStatus.charging && batteryStatus.dischargingTime && (
          <div className="text-xs text-muted-foreground mb-2">
            예상 사용 시간: 약 {Math.round(batteryStatus.dischargingTime / 3600)}시간
          </div>
        )}

        {/* 연결 상태 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {isConnected ? (
            <>
              <Zap className="w-3 h-3 text-green-600" />
              <span>실시간 연결됨</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-gray-600" />
              <span>오프라인 모드</span>
            </>
          )}
        </div>

        {/* 데이터 사용량 */}
        {metrics && (
          <div className="text-xs text-muted-foreground mb-2">
            데이터: ↑{formatBytes(metrics.totalDataSent)} ↓{formatBytes(metrics.totalDataReceived)}
          </div>
        )}

        {/* 배터리 절약 팁 */}
        {batterySavingTips.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium mb-2">절전 안내</div>
            <AnimatePresence>
              {batterySavingTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-xs text-muted-foreground mb-1 pl-3 relative"
                >
                  <span className="absolute left-0">•</span>
                  {tip}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * 간단한 배터리 인디케이터
 * 헤더나 작은 공간에 표시용
 */
export function BatteryIndicator() {
  const { batteryStatus, optimizationMode } = useOptimizedSocket({
    enableBatteryOptimization: true
  });

  if (!batteryStatus) return null;

  const batteryPercentage = Math.round(batteryStatus.level * 100);
  const isLowBattery = batteryPercentage <= 20;
  const isCriticalBattery = batteryPercentage <= 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-1.5"
    >
      {batteryStatus.charging ? (
        <BatteryCharging className={cn(
          "w-4 h-4",
          "text-green-600"
        )} />
      ) : (
        <Battery className={cn(
          "w-4 h-4",
          isCriticalBattery && "text-red-600",
          isLowBattery && !isCriticalBattery && "text-yellow-600",
          !isLowBattery && "text-gray-600"
        )} />
      )}
      <span className={cn(
        "text-sm font-medium",
        isCriticalBattery && "text-red-600",
        isLowBattery && !isCriticalBattery && "text-yellow-600",
        !isLowBattery && "text-gray-600"
      )}>
        {batteryPercentage}%
      </span>
      {optimizationMode !== 'normal' && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full",
          optimizationMode === 'low-power' && "bg-yellow-100 text-yellow-800",
          optimizationMode === 'critical' && "bg-red-100 text-red-800",
          optimizationMode === 'charging' && "bg-green-100 text-green-800"
        )}>
          {optimizationMode === 'low-power' && '절전'}
          {optimizationMode === 'critical' && '긴급'}
          {optimizationMode === 'charging' && '충전'}
        </span>
      )}
    </motion.div>
  );
}

/**
 * 모바일 최적화 상태 카드
 * 설정 페이지나 디버그용
 */
export function OptimizationStatusCard() {
  const {
    batteryStatus,
    optimizationMode,
    isConnected,
    connectionState,
    metrics,
    getQueuedMessageCount
  } = useOptimizedSocket({
    enableBatteryOptimization: true
  });

  const queuedMessages = getQueuedMessageCount();

  return (
    <div className="card-mobile">
      <h3 className="text-lg font-semibold mb-4">모바일 최적화 상태</h3>
      
      <div className="space-y-4">
        {/* 배터리 상태 */}
        {batteryStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">배터리</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {Math.round(batteryStatus.level * 100)}%
              </span>
              {batteryStatus.charging && (
                <BatteryCharging className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>
        )}

        {/* 최적화 모드 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">최적화 모드</span>
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            optimizationMode === 'charging' && "bg-green-100 text-green-800",
            optimizationMode === 'normal' && "bg-blue-100 text-blue-800",
            optimizationMode === 'low-power' && "bg-yellow-100 text-yellow-800",
            optimizationMode === 'critical' && "bg-red-100 text-red-800"
          )}>
            {optimizationMode}
          </span>
        </div>

        {/* 연결 상태 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">연결 상태</span>
          <span className={cn(
            "px-2 py-1 rounded text-xs font-medium",
            isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          )}>
            {connectionState}
          </span>
        </div>

        {/* 지연시간 */}
        {metrics && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">평균 지연시간</span>
            <span className="font-medium">{metrics.averageLatency}ms</span>
          </div>
        )}

        {/* 큐 메시지 */}
        {queuedMessages > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">대기 중인 메시지</span>
            <span className="font-medium">{queuedMessages}개</span>
          </div>
        )}

        {/* 데이터 사용량 */}
        {metrics && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-sm text-muted-foreground mb-2">데이터 사용량</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">전송</div>
                <div className="font-medium">{formatBytes(metrics.totalDataSent)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">수신</div>
                <div className="font-medium">{formatBytes(metrics.totalDataReceived)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 바이트를 읽기 쉬운 형식으로 변환
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}