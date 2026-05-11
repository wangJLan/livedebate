// 直播辩论系统 - 统一服务入口
// 包含：业务路由、WebSocket、SRS代理、管理后台静态页面
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const cfg = require('./config/server-mode.node.js');
const { getCurrentServerConfig, SRS_SERVER_URL } = cfg;
const mockData = require('../backend/mock/data');

const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3001;

const app = express();

// ==================== CORS ====================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});

app.use(express.json());

// ==================== WebSocket ====================
let WebSocketServer;
try {
  WebSocketServer = require('ws').WebSocketServer;
} catch (e) {
  console.warn('⚠️ ws 模块未安装，npm install ws');
}

const wsClients = new Set();
const server = http.createServer(app);
let wss = null;

if (WebSocketServer) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('✅ WebSocket 连接:', req.socket.remoteAddress);
    wsClients.add(ws);

    ws.send(JSON.stringify({ type: 'connected', message: '已连接', timestamp: Date.now() }));

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e) {
        console.error('WS 消息解析失败:', e);
      }
    });

    ws.on('close', () => {
      console.log('❌ WebSocket 断开');
      wsClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WS 错误:', err);
      wsClients.delete(ws);
    });
  });
}

function broadcast(type, data) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data, timestamp: Date.now() });
  wsClients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
    else wsClients.delete(client);
  });
}

// ==================== 首页 ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// ==================== 数据大屏 ====================
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'dashboard.html'));
});

// ==================== 管理后台静态页面 ====================
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// ==================== 请求日志 ====================
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/live')) {
    console.log(`📥 ${req.method} ${req.path}`);
  }
  next();
});

// ==================== 业务路由（直接挂载，无需代理） ====================
app.use('/api', require('../backend/routes/votes'));
app.use('/api', require('../backend/routes/debate'));
app.use('/api', require('../backend/routes/ai'));
app.use('/api', require('../backend/routes/live'));
app.use('/api', require('../backend/routes/streams'));
app.use('/api', require('../backend/routes/admin'));
app.use('/api', require('../backend/routes/wechat'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== /live 代理到 SRS ====================
if (SRS_SERVER_URL) {
  console.log(`📺 SRS 代理: /live/* -> ${SRS_SERVER_URL}/live/*`);

  const srsProxy = createProxyMiddleware({
    target: SRS_SERVER_URL,
    changeOrigin: true,
    pathRewrite: (pathStr) => pathStr.startsWith('/live') ? pathStr : '/live' + pathStr,
    onProxyReq: (proxyReq, req) => {
      console.log(`🔄 SRS ${req.method} ${req.path}`);
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    },
    onError: (err, req, res) => {
      console.error(`❌ SRS代理错误 ${req.path}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ code: 502, message: `SRS不可用: ${SRS_SERVER_URL}` });
      }
    }
  });

  app.use('/live', srsProxy);
}

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `路由 ${req.url} 不存在` });
});

// ==================== 错误处理 ====================
app.use((err, req, res, next) => {
  console.error('❌ 服务错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误: ' + err.message });
});

// ==================== 启动 ====================
mockData.initAll();

server.listen(PORT, '0.0.0.0', () => {
  const cfg = getCurrentServerConfig();
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📋 直播辩论系统 - 统一服务');
  console.log(`🚀 运行地址: http://localhost:${PORT}`);
  console.log(`📡 API 前缀: /api`);
  console.log(`🌐 WebSocket: ${wss ? 'ws://localhost:' + PORT + '/ws' : '未启用'}`);
  console.log(`📺 SRS: ${SRS_SERVER_URL}`);
  console.log('═══════════════════════════════════════');
  console.log('');
});

module.exports = { app, broadcast };
