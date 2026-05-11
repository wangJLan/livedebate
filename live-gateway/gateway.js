// 直播辩论系统 - 网关中间层
// 职责：CORS、代理转发(/api -> backend)、WebSocket中继、SRS直播流代理、管理后台静态页面
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const cfg = require('./config/server-mode.node.js');
const { getCurrentServerConfig, printConfig, BACKEND_SERVER_URL, PRIORITIZE_BACKEND_SERVER, SRS_SERVER_URL } = cfg;

const config = getCurrentServerConfig();
const PORT = config.port;

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
        // 其他消息类型可根据需要扩展
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

// 广播给所有客户端
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

// ==================== /api 代理到 backend ====================
if (BACKEND_SERVER_URL && PRIORITIZE_BACKEND_SERVER) {
  console.log(`🔗 API 代理: /api/* -> ${BACKEND_SERVER_URL}/api/*`);

  const apiProxy = createProxyMiddleware({
    target: BACKEND_SERVER_URL,
    changeOrigin: true,
    pathRewrite: (pathStr) => '/api' + pathStr,
    onProxyReq: (proxyReq, req) => {
      console.log(`🔄 代理 ${req.method} ${req.path} -> ${BACKEND_SERVER_URL}/api${req.path}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`✅ 代理 ${req.path} <- ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`❌ 代理错误 ${req.path}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ code: 502, message: `无法连接后端: ${BACKEND_SERVER_URL}`, error: err.message });
      }
    }
  });

  app.use('/api', apiProxy);
}

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
    onProxyRes: (proxyRes, req) => {
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

// ==================== 启动 ====================
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  printConfig();
  console.log(`🌐 WebSocket: ${wss ? 'ws://localhost:' + PORT + '/ws' : '未启用'}`);
  console.log(`✅ 网关已启动\n`);
});

module.exports = { app, broadcast };
