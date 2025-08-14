import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisManager, queueManager } from './queue/index';
import { QueueHandler, queueProcessor } from './handlers/queue.handler';
import { NamingHandler } from './handlers/naming.handler';

// Express 앱 초기화
const app = express();

// Express 미들웨어 설정
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CORS 헤더 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const httpServer = createServer(app);

// Socket.IO 서버 설정
const io = new Server(httpServer, {
  cors: {
    origin: '*', // 개발 환경에서는 모든 origin 허용
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['content-type', 'authorization']
  },
  transports: ['polling', 'websocket'], // polling을 먼저 시도
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true // Engine.IO v3 클라이언트도 허용
});

// 전역 IO 인스턴스 저장 (QueueProcessor에서 사용)
declare global {
  var io: Server;
}

// Redis 및 대기열 시스템 초기화
async function initializeRedisAndQueue() {
  try {
    // Redis 연결
    await redisManager.connect();
    console.log('✅ Redis connected');
    
    // Redis 어댑터 설정 (수평 확장용)
    const pubClient = redisManager.getPubClient();
    const subClient = redisManager.getSubClient();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter configured for Socket.IO');
    
    // 대기열 관리자 초기화
    await queueManager.initialize();
    console.log('✅ Queue manager initialized');
    
    // 대기열 프로세서 시작
    queueProcessor.start();
    console.log('✅ Queue processor started');
    
    // 전역 IO 인스턴스 저장
    global.io = io;
    
  } catch (error) {
    console.error('❌ Redis/Queue initialization failed:', error);
    // Redis 없이도 기본 기능은 동작하도록
    console.log('⚠️ Running without Redis queue system');
  }
}

// 네임스페이스 설정
const namingNamespace = io.of('/naming');
const queueNamespace = io.of('/queue');

// 인증 미들웨어
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const sessionId = socket.handshake.headers.cookie?.match(/session=([^;]+)/)?.[1];
    
    // TODO: 실제 인증 로직 구현
    // 현재는 개발 모드로 모든 연결 허용
    socket.data.userId = socket.handshake.auth.userId || `guest_${socket.id}`;
    socket.data.sessionId = sessionId;
    
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Rate limiting을 위한 메모리 스토어
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting 미들웨어
function rateLimitMiddleware(eventName: string, limit: number = 10, windowMs: number = 60000) {
  return (socket: any, next: any) => {
    const key = `${socket.data.userId}:${eventName}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return next(new Error('Rate limit exceeded'));
    }

    record.count++;
    next();
  };
}

// 메인 네임스페이스 연결 핸들러
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.data.userId} (${socket.id})`);

  // 연결 시 초기 상태 전송
  socket.emit('connected', {
    userId: socket.data.userId,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // 연결 해제 처리
  socket.on('disconnect', (reason) => {
    console.log(`👋 User disconnected: ${socket.data.userId} (${socket.id}) - Reason: ${reason}`);
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.data.userId}:`, error);
  });
});

// 작명 네임스페이스 핸들러
namingNamespace.on('connection', (socket) => {
  console.log(`🎯 User connected to /naming: ${socket.data.userId}`);
  
  // 작명 핸들러 초기화 (이미 구현된 NamingHandler 사용)
  const namingHandler = new NamingHandler(socket);
  
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected from /naming: ${socket.data.userId}`);
  });
});

// 대기열 네임스페이스 핸들러
queueNamespace.on('connection', (socket) => {
  console.log(`📊 User connected to /queue: ${socket.data.userId}`);
  
  // Redis 대기열 핸들러 초기화
  const queueHandler = new QueueHandler(socket);
  
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected from /queue: ${socket.data.userId}`);
    queueHandler.cleanup();
  });
});

// 서버 시작
const PORT = process.env.SOCKET_PORT || 3001;

export async function startSocketServer() {
  await initializeRedisAndQueue();
  
  httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.IO server running on port ${PORT}`);
    console.log(`📡 CORS origin: ${process.env.APP_URL || 'http://localhost:3000'}`);
    console.log(`🔌 Transports: websocket, polling`);
  });
}

// 정기적인 대기열 정리 (1시간마다)
setInterval(async () => {
  try {
    const removed = await queueManager.cleanupQueue(3600); // 1시간 이상 된 항목 제거
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old queue entries`);
    }
  } catch (error) {
    console.error('❌ Queue cleanup failed:', error);
  }
}, 3600000); // 1시간

// 서버 종료 처리
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing Socket.IO server');
  
  // 대기열 프로세서 중지
  queueProcessor.stop();
  
  // Redis 연결 종료
  await redisManager.disconnect();
  
  io.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});

// 개발 환경에서 직접 실행
if (process.env.NODE_ENV !== 'production' && import.meta.url === `file://${process.argv[1]}`) {
  startSocketServer();
}

export { io, namingNamespace, queueNamespace };