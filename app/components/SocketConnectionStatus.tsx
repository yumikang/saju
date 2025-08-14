import { useEffect } from 'react';
import { useSocket } from '~/hooks/useSocket';
import { cn } from '~/lib/utils';

/**
 * Socket 연결 상태를 표시하는 컴포넌트
 * 개발 환경에서 디버깅용으로 사용
 */
export function SocketConnectionStatus() {
  const { 
    connectionState, 
    isConnected, 
    isReconnecting,
    lastError,
    socket 
  } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // 연결 성공 시 서버 정보 로깅
    const handleConnect = () => {
      console.log('✅ Socket connected:', {
        id: socket.id,
        recovered: socket.recovered,
        transport: socket.io.engine?.transport?.name
      });
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  // 개발 환경이 아니면 렌더링하지 않음
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all",
        isConnected && "bg-green-100 text-green-800 border border-green-200",
        isReconnecting && "bg-yellow-100 text-yellow-800 border border-yellow-200",
        connectionState === 'connecting' && "bg-blue-100 text-blue-800 border border-blue-200",
        connectionState === 'disconnected' && "bg-red-100 text-red-800 border border-red-200"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          isConnected && "bg-green-500",
          isReconnecting && "bg-yellow-500",
          connectionState === 'connecting' && "bg-blue-500",
          connectionState === 'disconnected' && "bg-red-500"
        )} />
        <span>
          {connectionState === 'connected' && '실시간 연결됨'}
          {connectionState === 'connecting' && '연결 중...'}
          {connectionState === 'reconnecting' && '재연결 중...'}
          {connectionState === 'disconnected' && '연결 끊김'}
        </span>
        {socket?.id && (
          <span className="text-xs opacity-70">
            ({socket.id.slice(0, 6)})
          </span>
        )}
      </div>
      
      {lastError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          Error: {lastError.message}
        </div>
      )}
    </div>
  );
}