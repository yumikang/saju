import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

/**
 * 배터리 최적화 설정
 */
interface BatteryOptimizationConfig {
  enableOptimization: boolean;
  lowBatteryThreshold: number; // 저전력 모드 임계값 (0.2 = 20%)
  criticalBatteryThreshold: number; // 긴급 모드 임계값 (0.1 = 10%)
  visibilityCheck: boolean; // 화면 표시 여부 체크
  networkCheck: boolean; // 네트워크 상태 체크
  adaptivePolling: boolean; // 적응형 폴링
}

/**
 * 배터리 상태
 */
interface BatteryStatus {
  level: number; // 0-1 사이 값 (0.5 = 50%)
  charging: boolean;
  chargingTime: number | null;
  dischargingTime: number | null;
}

/**
 * 최적화 모드
 */
type OptimizationMode = 'normal' | 'low-power' | 'critical' | 'charging';

/**
 * 모바일 배터리 최적화 훅
 * Socket.IO 연결과 업데이트 주기를 배터리 상태에 따라 조절
 */
export function useBatteryOptimization(
  config: Partial<BatteryOptimizationConfig> = {}
) {
  const defaultConfig: BatteryOptimizationConfig = {
    enableOptimization: true,
    lowBatteryThreshold: 0.2,
    criticalBatteryThreshold: 0.1,
    visibilityCheck: true,
    networkCheck: true,
    adaptivePolling: true,
    ...config
  };

  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('normal');
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [pollingInterval, setPollingInterval] = useState(10000); // 기본 10초

  const batteryManagerRef = useRef<any>(null);
  const visibilityListenerRef = useRef<() => void>();
  const networkListenerRef = useRef<() => void>();

  // 배터리 API 초기화
  useEffect(() => {
    if (!defaultConfig.enableOptimization) return;

    const initBattery = async () => {
      try {
        // Battery Status API 지원 체크
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          batteryManagerRef.current = battery;

          // 초기 배터리 상태 설정
          updateBatteryStatus(battery);

          // 배터리 이벤트 리스너 등록
          battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
          battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
          battery.addEventListener('chargingtimechange', () => updateBatteryStatus(battery));
          battery.addEventListener('dischargingtimechange', () => updateBatteryStatus(battery));
        } else {
          console.log('Battery Status API not supported');
        }
      } catch (error) {
        console.error('Failed to initialize battery monitoring:', error);
      }
    };

    initBattery();

    return () => {
      // 배터리 이벤트 리스너 정리
      if (batteryManagerRef.current) {
        const battery = batteryManagerRef.current;
        battery.removeEventListener('levelchange', updateBatteryStatus);
        battery.removeEventListener('chargingchange', updateBatteryStatus);
        battery.removeEventListener('chargingtimechange', updateBatteryStatus);
        battery.removeEventListener('dischargingtimechange', updateBatteryStatus);
      }
    };
  }, [defaultConfig.enableOptimization]);

  // 페이지 가시성 체크
  useEffect(() => {
    if (!defaultConfig.visibilityCheck) return;

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
      console.log(`Page visibility: ${!document.hidden ? 'visible' : 'hidden'}`);
    };

    visibilityListenerRef.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [defaultConfig.visibilityCheck]);

  // 네트워크 상태 체크
  useEffect(() => {
    if (!defaultConfig.networkCheck) return;

    const handleOnline = () => {
      setNetworkStatus(true);
      console.log('Network: online');
    };

    const handleOffline = () => {
      setNetworkStatus(false);
      console.log('Network: offline');
    };

    networkListenerRef.current = handleOnline;
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [defaultConfig.networkCheck]);

  // 배터리 상태 업데이트
  const updateBatteryStatus = useCallback((battery: any) => {
    const status: BatteryStatus = {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime === Infinity ? null : battery.chargingTime,
      dischargingTime: battery.dischargingTime === Infinity ? null : battery.dischargingTime
    };

    setBatteryStatus(status);

    // 최적화 모드 결정
    let mode: OptimizationMode = 'normal';
    
    if (battery.charging) {
      mode = 'charging';
    } else if (battery.level <= defaultConfig.criticalBatteryThreshold) {
      mode = 'critical';
    } else if (battery.level <= defaultConfig.lowBatteryThreshold) {
      mode = 'low-power';
    }

    setOptimizationMode(mode);
    console.log(`Battery optimization mode: ${mode} (${Math.round(battery.level * 100)}%)`);
  }, [defaultConfig.criticalBatteryThreshold, defaultConfig.lowBatteryThreshold]);

  // 적응형 폴링 간격 계산
  useEffect(() => {
    if (!defaultConfig.adaptivePolling) return;

    let interval = 10000; // 기본 10초

    // 최적화 모드에 따른 조정
    switch (optimizationMode) {
      case 'charging':
        interval = 5000; // 충전 중: 5초
        break;
      case 'normal':
        interval = 10000; // 정상: 10초
        break;
      case 'low-power':
        interval = 30000; // 저전력: 30초
        break;
      case 'critical':
        interval = 60000; // 긴급: 60초
        break;
    }

    // 페이지가 숨겨진 경우 간격 증가
    if (!isPageVisible) {
      interval = Math.min(interval * 3, 300000); // 최대 5분
    }

    // 오프라인인 경우 폴링 중지
    if (!networkStatus) {
      interval = 0; // 폴링 중지
    }

    setPollingInterval(interval);
    console.log(`Polling interval adjusted to: ${interval}ms`);
  }, [optimizationMode, isPageVisible, networkStatus, defaultConfig.adaptivePolling]);

  // Socket.IO 연결 최적화
  const optimizeSocketConnection = useCallback((socket: any) => {
    if (!socket || !defaultConfig.enableOptimization) return;

    // 최적화 모드에 따른 Socket.IO 설정 조정
    switch (optimizationMode) {
      case 'critical':
        // 긴급 모드: 최소한의 연결만 유지
        socket.io.opts.reconnectionAttempts = 3;
        socket.io.opts.reconnectionDelay = 30000;
        socket.io.opts.timeout = 10000;
        socket.io.opts.transports = ['polling']; // WebSocket 비활성화
        break;
      
      case 'low-power':
        // 저전력 모드: 연결 빈도 감소
        socket.io.opts.reconnectionAttempts = 5;
        socket.io.opts.reconnectionDelay = 15000;
        socket.io.opts.timeout = 20000;
        socket.io.opts.transports = ['polling', 'websocket'];
        break;
      
      case 'charging':
        // 충전 중: 최적 성능
        socket.io.opts.reconnectionAttempts = Infinity;
        socket.io.opts.reconnectionDelay = 1000;
        socket.io.opts.timeout = 20000;
        socket.io.opts.transports = ['websocket', 'polling'];
        break;
      
      default:
        // 정상 모드: 균형잡힌 설정
        socket.io.opts.reconnectionAttempts = 10;
        socket.io.opts.reconnectionDelay = 5000;
        socket.io.opts.timeout = 20000;
        socket.io.opts.transports = ['websocket', 'polling'];
    }

    // 페이지가 숨겨진 경우 연결 일시 중지
    if (!isPageVisible && optimizationMode !== 'charging') {
      socket.disconnect();
      console.log('Socket disconnected due to page visibility');
    } else if (isPageVisible && !socket.connected) {
      socket.connect();
      console.log('Socket reconnected due to page visibility');
    }
  }, [optimizationMode, isPageVisible, defaultConfig.enableOptimization]);

  // 데이터 동기화 전략
  const getSyncStrategy = useCallback(() => {
    const strategy = {
      immediate: [] as string[], // 즉시 동기화
      batched: [] as string[], // 배치 동기화
      deferred: [] as string[], // 지연 동기화
      skip: [] as string[] // 동기화 건너뛰기
    };

    switch (optimizationMode) {
      case 'critical':
        // 긴급 모드: 최소한의 동기화만
        strategy.immediate = ['critical_updates'];
        strategy.skip = ['analytics', 'metrics', 'non_essential'];
        break;
      
      case 'low-power':
        // 저전력 모드: 중요한 업데이트만 즉시
        strategy.immediate = ['user_actions', 'critical_updates'];
        strategy.batched = ['queue_status', 'progress_updates'];
        strategy.deferred = ['analytics', 'metrics'];
        break;
      
      case 'charging':
        // 충전 중: 모든 동기화 활성화
        strategy.immediate = ['user_actions', 'critical_updates', 'queue_status', 'progress_updates'];
        strategy.batched = ['analytics', 'metrics'];
        break;
      
      default:
        // 정상 모드: 균형잡힌 동기화
        strategy.immediate = ['user_actions', 'critical_updates'];
        strategy.batched = ['queue_status', 'progress_updates', 'analytics'];
        strategy.deferred = ['metrics'];
    }

    return strategy;
  }, [optimizationMode]);

  // Wake Lock API 관리 (화면 켜짐 유지)
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && optimizationMode === 'charging') {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('Wake lock acquired');
        
        // 화면이 다시 표시될 때 wake lock 재획득
        document.addEventListener('visibilitychange', async () => {
          if (!document.hidden && wakeLock.released) {
            await (navigator as any).wakeLock.request('screen');
          }
        });
        
        return wakeLock;
      } catch (error) {
        console.error('Failed to acquire wake lock:', error);
      }
    }
    return null;
  }, [optimizationMode]);

  // 배터리 절약 팁 제공
  const getBatterySavingTips = useCallback(() => {
    const tips: string[] = [];

    if (batteryStatus && !batteryStatus.charging) {
      if (batteryStatus.level <= 0.2) {
        tips.push('배터리가 부족합니다. 충전기를 연결하세요.');
        tips.push('실시간 업데이트가 제한됩니다.');
      }
      
      if (batteryStatus.level <= 0.1) {
        tips.push('긴급 배터리 모드가 활성화되었습니다.');
        tips.push('필수 기능만 동작합니다.');
      }

      if (pollingInterval > 30000) {
        tips.push('업데이트 주기가 연장되었습니다.');
      }
    }

    return tips;
  }, [batteryStatus, pollingInterval]);

  return {
    // 배터리 상태
    batteryStatus,
    optimizationMode,
    
    // 시스템 상태
    isPageVisible,
    networkStatus,
    pollingInterval,
    
    // 최적화 함수
    optimizeSocketConnection,
    getSyncStrategy,
    requestWakeLock,
    getBatterySavingTips,
    
    // 수동 제어
    setOptimizationMode,
    
    // 설정
    config: defaultConfig
  };
}