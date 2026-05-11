// 直播辩论系统 - 后端业务服务
const express = require('express');
const cors = require('cors');
const config = require('./config');
const mockData = require('./mock/data');

const app = express();

// CORS
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

// 请求日志
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`📥 ${req.method} ${req.path}`);
  }
  next();
});

// ==================== 加载路由 ====================
app.use('/api', require('./routes/votes'));
app.use('/api', require('./routes/debate'));
app.use('/api', require('./routes/ai'));
app.use('/api', require('./routes/live'));
app.use('/api', require('./routes/streams'));
app.use('/api', require('./routes/admin'));
app.use('/api', require('./routes/wechat'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `路由 ${req.path} 不存在` });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ 服务错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误: ' + err.message });
});

// 启动
mockData.initAll();

app.listen(config.PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log(`📋 播辩论系统 - 后端服务`);
  console.log(`🚀 运行地址: http://localhost:${config.PORT}`);
  console.log(`📡 API 前缀: /api`);
  console.log('═══════════════════════════════════════');
});

module.exports = app;
