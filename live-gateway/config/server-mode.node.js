// 网关配置
const USE_MOCK_SERVER = false; // 关闭mock模式，全部代理到backend
const BACKEND_SERVER_URL = 'http://localhost:3000'; // 指向新的backend服务
const PRIORITIZE_BACKEND_SERVER = true; // 所有API请求代理到backend

const getLocalIP = () => '192.168.31.189';
const SRS_SERVER_URL = 'http://192.168.31.189:8086'; // SRS流媒体地址

const WECHAT = {
  appid: process.env.WECHAT_APPID || 'wx94289b0d2ca7a802',
  secret: process.env.WECHAT_SECRET || 'YOUR_APP_SECRET_HERE',
  useMock: true
};

const GATEWAY_PORT = process.env.PORT || process.env.GATEWAY_PORT || 3001;

const getCurrentServerConfig = () => ({
  mode: USE_MOCK_SERVER ? 'mock' : 'proxy',
  port: GATEWAY_PORT,
  url: `http://${getLocalIP()}:${GATEWAY_PORT}`,
  wechat: WECHAT,
  backendUrl: BACKEND_SERVER_URL,
  srsUrl: SRS_SERVER_URL
});

const printConfig = () => {
  const cfg = getCurrentServerConfig();
  console.log('═══════════════════════════════════════');
  console.log('📋 网关配置');
  console.log('═══════════════════════════════════════');
  console.log(`模式: ${cfg.mode === 'proxy' ? '🔗 代理模式 -> ' + cfg.backendUrl : '🧪 模拟模式'}`);
  console.log(`端口: ${cfg.port}`);
  console.log(`SRS: ${cfg.srsUrl}`);
  console.log('═══════════════════════════════════════');
};

module.exports = {
  USE_MOCK_SERVER,
  BACKEND_SERVER_URL,
  PRIORITIZE_BACKEND_SERVER,
  SRS_SERVER_URL,
  getCurrentServerConfig,
  printConfig,
  getLocalIP,
  WECHAT
};
