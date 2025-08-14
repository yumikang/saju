import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { redisManager, queueManager } from '../queue/index';
import { QueueHandler, queueProcessor } from '../handlers/queue.handler';
import type { NamingStartRequest, QueueJoinRequest } from '../types';

describe('Socket.IO 실시간 기능 통합 테스트', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let httpServer: any;
  const TEST_PORT = 3002;

  beforeAll(async () => {
    // HTTP 서버 생성
    httpServer = createServer();
    
    // Socket.IO 서버 초기화
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Redis 연결 (테스트 환경)
    process.env.REDIS_URL = 'redis://localhost:6379/1'; // 테스트용 DB 1 사용
    await redisManager.connect();
    await queueManager.initialize();

    // 서버 리스너 설정
    io.on('connection', (socket) => {
      serverSocket = socket;
    });

    // 서버 시작
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => {
        console.log(`테스트 서버 시작: ${TEST_PORT}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // 정리
    io.close();
    httpServer.close();
    await redisManager.disconnect();
  });

  beforeEach(async () => {
    // 클라이언트 소켓 생성
    clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
      reconnection: false
    });

    // 연결 대기
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(() => {
    // 클라이언트 소켓 정리
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('연결 테스트', () => {
    it('클라이언트가 서버에 연결되어야 함', () => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
    });

    it('연결 시 초기 상태를 전송해야 함', (done) => {
      const testSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        reconnection: false
      });

      testSocket.on('connected', (data) => {
        expect(data).toHaveProperty('socketId');
        expect(data).toHaveProperty('timestamp');
        testSocket.disconnect();
        done();
      });
    });

    it('연결 해제를 처리해야 함', (done) => {
      const testSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        reconnection: false
      });

      testSocket.on('connect', () => {
        testSocket.disconnect();
      });

      testSocket.on('disconnect', (reason) => {
        expect(reason).toBe('io client disconnect');
        done();
      });
    });
  });

  describe('작명 프로세스 테스트', () => {
    it('작명 시작 요청을 처리해야 함', (done) => {
      const namingRequest: NamingStartRequest = {
        requestId: `test_${Date.now()}`,
        birthDate: '1990-01-01',
        birthTime: '12:00',
        isLunar: false,
        gender: 'M',
        lastName: '김',
        preferences: {
          style: 'balanced',
          values: ['지혜', '성공']
        },
        timestamp: new Date().toISOString()
      };

      serverSocket.on('naming:start', (data: NamingStartRequest) => {
        expect(data.requestId).toBe(namingRequest.requestId);
        expect(data.lastName).toBe('김');
        
        // 시작 응답 전송
        serverSocket.emit('naming:started', {
          requestId: data.requestId,
          timestamp: new Date().toISOString()
        });
      });

      clientSocket.emit('naming:start', namingRequest);

      clientSocket.on('naming:started', (response) => {
        expect(response.requestId).toBe(namingRequest.requestId);
        done();
      });
    });

    it('작명 진행상황을 전송해야 함', (done) => {
      const requestId = `test_${Date.now()}`;
      let progressCount = 0;

      clientSocket.on('naming:progress', (data) => {
        progressCount++;
        expect(data).toHaveProperty('step');
        expect(data).toHaveProperty('progress');
        expect(data).toHaveProperty('message');
        
        if (progressCount === 3) {
          done();
        }
      });

      // 서버에서 진행상황 전송
      serverSocket.emit('naming:progress', {
        requestId,
        step: 1,
        totalSteps: 6,
        name: '사주 분석',
        progress: 20,
        message: '사주 분석 중...',
        timestamp: new Date().toISOString()
      });

      serverSocket.emit('naming:progress', {
        requestId,
        step: 2,
        totalSteps: 6,
        name: '오행 계산',
        progress: 40,
        message: '오행 계산 중...',
        timestamp: new Date().toISOString()
      });

      serverSocket.emit('naming:progress', {
        requestId,
        step: 3,
        totalSteps: 6,
        name: 'AI 생성',
        progress: 60,
        message: 'AI 생성 중...',
        timestamp: new Date().toISOString()
      });
    });

    it('작명 완료를 처리해야 함', (done) => {
      const requestId = `test_${Date.now()}`;

      clientSocket.on('naming:complete', (data) => {
        expect(data.requestId).toBe(requestId);
        expect(data.results).toBeDefined();
        expect(Array.isArray(data.results)).toBe(true);
        expect(data.results.length).toBeGreaterThan(0);
        done();
      });

      // 서버에서 완료 전송
      serverSocket.emit('naming:complete', {
        requestId,
        results: [
          {
            fullName: '김지혜',
            firstNameHanja: '智慧',
            scores: {
              overall: 85,
              balance: 80,
              sound: 90,
              meaning: 85
            },
            totalStrokes: 28,
            explanation: '지혜로운 이름입니다.'
          }
        ],
        timestamp: new Date().toISOString()
      });
    });

    it('작명 취소를 처리해야 함', (done) => {
      const requestId = `test_${Date.now()}`;

      serverSocket.on('naming:cancel', (data) => {
        expect(data.requestId).toBe(requestId);
        
        serverSocket.emit('naming:cancelled', {
          requestId: data.requestId,
          timestamp: new Date().toISOString()
        });
      });

      clientSocket.emit('naming:cancel', { requestId });

      clientSocket.on('naming:cancelled', (response) => {
        expect(response.requestId).toBe(requestId);
        done();
      });
    });

    it('에러를 처리해야 함', (done) => {
      const requestId = `test_${Date.now()}`;

      clientSocket.on('naming:error', (data) => {
        expect(data.requestId).toBe(requestId);
        expect(data.error).toBeDefined();
        expect(data.error.code).toBe('NAMING_ERROR');
        done();
      });

      // 서버에서 에러 전송
      serverSocket.emit('naming:error', {
        requestId,
        error: {
          code: 'NAMING_ERROR',
          message: '작명 처리 중 오류가 발생했습니다.'
        },
        timestamp: new Date().toISOString()
      });
    });
  });

  describe('대기열 시스템 테스트', () => {
    it('대기열 참가를 처리해야 함', async () => {
      const request: QueueJoinRequest = {
        requestId: `queue_${Date.now()}`,
        priority: 0,
        timestamp: new Date().toISOString()
      };

      const status = await queueManager.addToQueue({
        requestId: request.requestId,
        userId: 'test_user',
        socketId: 'test_socket',
        priority: 0,
        estimatedProcessingTime: 30
      });

      expect(status).toBeDefined();
      expect(status.position).toBeGreaterThan(0);
      expect(status.totalInQueue).toBeGreaterThanOrEqual(1);
    });

    it('대기열 상태를 조회해야 함', async () => {
      const requestId = `queue_${Date.now()}`;
      
      // 대기열에 추가
      await queueManager.addToQueue({
        requestId,
        userId: 'test_user',
        socketId: 'test_socket',
        priority: 0,
        estimatedProcessingTime: 30
      });

      // 상태 조회
      const status = await queueManager.getQueueStatus(requestId);
      
      expect(status).toBeDefined();
      expect(status.position).toBeGreaterThan(0);
      expect(status.isProcessing).toBe(false);
    });

    it('대기열 이탈을 처리해야 함', async () => {
      const requestId = `queue_${Date.now()}`;
      const userId = 'test_user';
      
      // 대기열에 추가
      await queueManager.addToQueue({
        requestId,
        userId,
        socketId: 'test_socket',
        priority: 0,
        estimatedProcessingTime: 30
      });

      // 대기열에서 제거
      await queueManager.removeFromQueue(requestId, userId);

      // 상태 확인
      const status = await queueManager.getQueueStatus(requestId);
      expect(status.position).toBe(-1); // 대기열에 없음
    });

    it('우선순위 대기열을 처리해야 함', async () => {
      const normalRequest = `normal_${Date.now()}`;
      const priorityRequest = `priority_${Date.now()}`;
      
      // 일반 요청 추가
      await queueManager.addToQueue({
        requestId: normalRequest,
        userId: 'user1',
        socketId: 'socket1',
        priority: 0,
        estimatedProcessingTime: 30
      });

      // 우선순위 요청 추가
      await queueManager.addToQueue({
        requestId: priorityRequest,
        userId: 'user2',
        socketId: 'socket2',
        priority: 10, // 높은 우선순위
        estimatedProcessingTime: 30
      });

      // 다음 처리할 요청 가져오기
      const next = await queueManager.getNextForProcessing();
      
      expect(next).toBeDefined();
      expect(next?.requestId).toBe(priorityRequest); // 우선순위 요청이 먼저
    });

    it('대기열 메트릭을 제공해야 함', async () => {
      const metrics = await queueManager.getQueueMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('normalQueue');
      expect(metrics).toHaveProperty('priorityQueue');
      expect(metrics).toHaveProperty('processing');
      expect(metrics).toHaveProperty('capacity');
      expect(metrics).toHaveProperty('averageWaitTime');
    });
  });

  describe('재연결 처리 테스트', () => {
    it('연결이 끊어진 후 재연결되어야 함', (done) => {
      const reconnectSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 100
      });

      let disconnectCount = 0;
      let reconnectCount = 0;

      reconnectSocket.on('connect', () => {
        if (reconnectCount === 0) {
          // 첫 연결 후 강제 연결 해제
          reconnectSocket.io.engine.close();
        }
      });

      reconnectSocket.on('disconnect', () => {
        disconnectCount++;
      });

      reconnectSocket.on('reconnect', (attemptNumber) => {
        reconnectCount++;
        expect(attemptNumber).toBeGreaterThan(0);
        expect(disconnectCount).toBeGreaterThan(0);
        reconnectSocket.disconnect();
        done();
      });
    });
  });

  describe('메시지 큐잉 테스트', () => {
    it('오프라인 시 메시지를 큐에 저장해야 함', () => {
      const messageQueue: any[] = [];
      
      // 오프라인 시뮬레이션
      const offlineEmit = (event: string, data: any) => {
        if (!clientSocket.connected) {
          messageQueue.push({ event, data, timestamp: Date.now() });
        } else {
          clientSocket.emit(event, data);
        }
      };

      // 연결 해제
      clientSocket.disconnect();
      
      // 메시지 전송 시도
      offlineEmit('test:message', { content: 'offline message 1' });
      offlineEmit('test:message', { content: 'offline message 2' });
      
      expect(messageQueue.length).toBe(2);
      expect(messageQueue[0].event).toBe('test:message');
    });
  });

  describe('네임스페이스 테스트', () => {
    it('naming 네임스페이스에 연결되어야 함', (done) => {
      const namingSocket = ioClient(`http://localhost:${TEST_PORT}/naming`, {
        transports: ['websocket'],
        reconnection: false
      });

      namingSocket.on('connect', () => {
        expect(namingSocket.connected).toBe(true);
        expect(namingSocket.nsp).toBe('/naming');
        namingSocket.disconnect();
        done();
      });
    });

    it('queue 네임스페이스에 연결되어야 함', (done) => {
      const queueSocket = ioClient(`http://localhost:${TEST_PORT}/queue`, {
        transports: ['websocket'],
        reconnection: false
      });

      queueSocket.on('connect', () => {
        expect(queueSocket.connected).toBe(true);
        expect(queueSocket.nsp).toBe('/queue');
        queueSocket.disconnect();
        done();
      });
    });
  });

  describe('성능 테스트', () => {
    it('다수의 동시 연결을 처리해야 함', async () => {
      const clients: ClientSocket[] = [];
      const connectionPromises: Promise<void>[] = [];

      // 10개의 동시 연결 생성
      for (let i = 0; i < 10; i++) {
        const client = ioClient(`http://localhost:${TEST_PORT}`, {
          transports: ['websocket'],
          reconnection: false
        });
        
        clients.push(client);
        
        connectionPromises.push(
          new Promise<void>((resolve) => {
            client.on('connect', resolve);
          })
        );
      }

      // 모든 연결 대기
      await Promise.all(connectionPromises);
      
      // 모든 클라이언트가 연결되었는지 확인
      clients.forEach(client => {
        expect(client.connected).toBe(true);
      });

      // 정리
      clients.forEach(client => client.disconnect());
    });

    it('대량 메시지를 처리해야 함', (done) => {
      let messageCount = 0;
      const totalMessages = 100;

      clientSocket.on('test:echo', (data) => {
        messageCount++;
        expect(data.index).toBeLessThan(totalMessages);
        
        if (messageCount === totalMessages) {
          done();
        }
      });

      // 서버에서 에코 처리
      serverSocket.on('test:message', (data: any) => {
        serverSocket.emit('test:echo', data);
      });

      // 대량 메시지 전송
      for (let i = 0; i < totalMessages; i++) {
        clientSocket.emit('test:message', { index: i });
      }
    });
  });
});