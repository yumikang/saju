import { useState } from 'react';
import { useRealtimeSocket, useNamingProcess, useQueueStatus, useConnectionMetrics } from '~/hooks/useRealtimeSocket';
import { SocketConnectionStatus } from './SocketConnectionStatus';
import { cn } from '~/lib/utils';

/**
 * 실시간 기능 데모 컴포넌트
 * Socket.IO + Zustand 통합 테스트용
 */
export function RealtimeDemo() {
  const { startNaming, cancelNaming, joinQueue, leaveQueue, checkQueueStatus, store } = useRealtimeSocket();
  const namingProcess = useNamingProcess();
  const queueStatus = useQueueStatus();
  const metrics = useConnectionMetrics();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    birthDate: '1990-01-01',
    birthTime: '12:00',
    isLunar: false,
    gender: 'M' as 'M' | 'F',
    lastName: '김',
    style: 'balanced' as 'traditional' | 'modern' | 'balanced'
  });
  
  // 작명 시작 핸들러
  const handleStartNaming = () => {
    const requestId = startNaming({
      ...formData,
      preferences: {
        style: formData.style,
        values: ['지혜', '성공', '건강']
      }
    });
    console.log('작명 시작:', requestId);
  };
  
  // 작명 취소 핸들러
  const handleCancelNaming = () => {
    if (store.naming.requestId) {
      cancelNaming(store.naming.requestId);
    }
  };
  
  return (
    <div className="container-mobile py-8 space-y-6">
      {/* Socket 연결 상태 */}
      <SocketConnectionStatus />
      
      {/* 메트릭 카드 */}
      <div className="card-mobile">
        <h3 className="text-lg font-semibold mb-4">연결 메트릭</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.latency}ms</div>
            <div className="text-sm text-muted-foreground">지연시간</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.totalMessagesSent}</div>
            <div className="text-sm text-muted-foreground">전송</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{metrics.totalMessagesReceived}</div>
            <div className="text-sm text-muted-foreground">수신</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              metrics.connectionQuality === 'excellent' && "text-green-600",
              metrics.connectionQuality === 'good' && "text-blue-600",
              metrics.connectionQuality === 'fair' && "text-yellow-600",
              metrics.connectionQuality === 'poor' && "text-red-600"
            )}>
              {metrics.connectionQuality}
            </div>
            <div className="text-sm text-muted-foreground">연결 품질</div>
          </div>
        </div>
      </div>
      
      {/* 작명 폼 */}
      <div className="card-mobile">
        <h3 className="text-lg font-semibold mb-4">작명 시작</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">생년월일</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">출생시간</label>
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">성씨</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">성별</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="M">남자</option>
                <option value="F">여자</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">스타일</label>
              <select
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="traditional">전통적</option>
                <option value="modern">현대적</option>
                <option value="balanced">균형</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartNaming}
              disabled={namingProcess.isProcessing}
              className={cn(
                "btn-mobile flex-1",
                "bg-primary text-primary-foreground",
                namingProcess.isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {namingProcess.isProcessing ? '진행 중...' : '작명 시작'}
            </button>
            
            {namingProcess.isProcessing && (
              <button
                onClick={handleCancelNaming}
                className="btn-mobile bg-destructive text-destructive-foreground"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 진행 상황 */}
      {namingProcess.status !== 'idle' && (
        <div className="card-mobile">
          <h3 className="text-lg font-semibold mb-4">작명 진행상황</h3>
          
          {/* 상태 배지 */}
          <div className="mb-4">
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              namingProcess.status === 'starting' && "bg-blue-100 text-blue-800",
              namingProcess.status === 'processing' && "bg-yellow-100 text-yellow-800",
              namingProcess.status === 'completed' && "bg-green-100 text-green-800",
              namingProcess.status === 'error' && "bg-red-100 text-red-800",
              namingProcess.status === 'cancelled' && "bg-gray-100 text-gray-800"
            )}>
              {namingProcess.status === 'starting' && '시작 중'}
              {namingProcess.status === 'processing' && '처리 중'}
              {namingProcess.status === 'completed' && '완료'}
              {namingProcess.status === 'error' && '오류'}
              {namingProcess.status === 'cancelled' && '취소됨'}
            </span>
          </div>
          
          {/* 프로그레스 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{namingProcess.stepName || '준비 중'}</span>
              <span>{namingProcess.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${namingProcess.progress}%` }}
              />
            </div>
            {namingProcess.message && (
              <p className="text-sm text-muted-foreground mt-1">{namingProcess.message}</p>
            )}
          </div>
          
          {/* 단계 표시 */}
          {namingProcess.totalSteps > 0 && (
            <div className="text-sm text-muted-foreground">
              단계: {namingProcess.currentStep} / {namingProcess.totalSteps}
            </div>
          )}
          
          {/* 결과 표시 */}
          {namingProcess.isCompleted && namingProcess.results.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">작명 결과:</h4>
              {namingProcess.results.slice(0, 5).map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{result.fullName}</div>
                      {result.firstNameHanja && (
                        <div className="text-sm text-muted-foreground">{result.firstNameHanja}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">종합 점수</div>
                      <div className="text-lg font-bold text-primary">
                        {result.scores.overall.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {result.explanation && (
                    <p className="text-sm text-muted-foreground mt-2">{result.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 에러 표시 */}
          {namingProcess.hasError && namingProcess.error.message && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{namingProcess.error.message}</p>
              {namingProcess.error.code && (
                <p className="text-sm text-red-600 mt-1">코드: {namingProcess.error.code}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 대기열 관리 */}
      <div className="card-mobile">
        <h3 className="text-lg font-semibold mb-4">대기열 관리</h3>
        
        {queueStatus.status === 'idle' ? (
          <button
            onClick={joinQueue}
            className="btn-mobile w-full bg-secondary text-secondary-foreground"
          >
            대기열 참가
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{queueStatus.position}</div>
                <div className="text-sm text-muted-foreground">내 순서</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{queueStatus.totalInQueue}</div>
                <div className="text-sm text-muted-foreground">전체 대기</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{queueStatus.formattedEstimatedTime}</div>
                <div className="text-sm text-muted-foreground">예상 시간</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={checkQueueStatus}
                className="btn-mobile flex-1 bg-secondary text-secondary-foreground"
              >
                상태 확인
              </button>
              <button
                onClick={leaveQueue}
                className="btn-mobile bg-destructive text-destructive-foreground"
              >
                대기열 나가기
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 히스토리 */}
      {store.history.length > 0 && (
        <div className="card-mobile">
          <h3 className="text-lg font-semibold mb-4">최근 작명 기록</h3>
          <div className="space-y-2">
            {store.history.map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-sm font-medium">{entry.requestId.slice(0, 10)}...</span>
                  <span className={cn(
                    "ml-2 text-xs",
                    entry.status === 'completed' && "text-green-600",
                    entry.status === 'error' && "text-red-600",
                    entry.status === 'cancelled' && "text-gray-600"
                  )}>
                    {entry.status === 'completed' && `✓ 완료 (${entry.resultsCount}개)`}
                    {entry.status === 'error' && `✗ 오류`}
                    {entry.status === 'cancelled' && `- 취소`}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}