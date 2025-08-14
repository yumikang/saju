#!/usr/bin/env node

// Socket.IO 서버 실행 스크립트 (ES Module)

import { register } from 'esbuild-register/dist/node.js';

register({
  target: 'node18',
  format: 'esm'
});

import('./app/socket/server.ts').then(module => {
  module.startSocketServer().catch(console.error);
}).catch(console.error);