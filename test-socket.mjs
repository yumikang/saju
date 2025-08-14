#!/usr/bin/env node

// Socket.IO 서버 테스트 스크립트

import { io } from 'socket.io-client';

console.log('🧪 Testing Socket.IO server connection...');

// 메인 네임스페이스 연결
const socket = io('http://localhost:3001', {
  auth: {
    userId: 'test_user_123'
  }
});

// 작명 네임스페이스 연결
const namingSocket = io('http://localhost:3001/naming', {
  auth: {
    userId: 'test_user_123'
  }
});

// 대기열 네임스페이스 연결
const queueSocket = io('http://localhost:3001/queue', {
  auth: {
    userId: 'test_user_123'
  }
});

// 메인 소켓 이벤트
socket.on('connect', () => {
  console.log('✅ Connected to main namespace');
});

socket.on('connected', (data) => {
  console.log('📋 Connection info:', data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from main namespace:', reason);
});

// 작명 소켓 이벤트
namingSocket.on('connect', () => {
  console.log('✅ Connected to /naming namespace');
  
  // 작명 시작 테스트
  console.log('🚀 Starting naming test...');
  namingSocket.emit('naming:start', {
    requestId: 'test_req_' + Date.now(),
    birthDate: '1990-01-01',
    gender: 'M'
  });
});

namingSocket.on('naming:started', (data) => {
  console.log('🎯 Naming started:', data);
});

namingSocket.on('naming:progress', (data) => {
  console.log(`📊 Progress: Step ${data.step} - ${data.name} (${data.progress}%)`);
});

namingSocket.on('naming:complete', (data) => {
  console.log('🎉 Naming complete:', data);
  
  // 테스트 완료 후 연결 종료
  setTimeout(() => {
    console.log('🔌 Closing connections...');
    socket.close();
    namingSocket.close();
    queueSocket.close();
    process.exit(0);
  }, 1000);
});

namingSocket.on('naming:error', (data) => {
  console.error('❌ Naming error:', data);
});

// 대기열 소켓 이벤트
queueSocket.on('connect', () => {
  console.log('✅ Connected to /queue namespace');
  
  // 대기열 참가 테스트
  queueSocket.emit('queue:join', {
    userId: 'test_user_123'
  });
});

queueSocket.on('queue:status', (data) => {
  console.log('📊 Queue status:', data);
});

queueSocket.on('queue:update', (data) => {
  console.log('🔄 Queue update:', data);
});

queueSocket.on('queue:ready', (data) => {
  console.log('✨ Queue ready:', data);
});

// 에러 핸들링
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  process.exit(1);
});

// 30초 후 자동 종료
setTimeout(() => {
  console.log('⏱️ Test timeout - closing connections');
  socket.close();
  namingSocket.close();
  queueSocket.close();
  process.exit(0);
}, 30000);