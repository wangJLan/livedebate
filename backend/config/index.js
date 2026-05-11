// 后端服务配置
module.exports = {
  PORT: process.env.BACKEND_PORT || 3000,
  MODE: process.env.NODE_ENV || 'development',
  WECHAT: {
    appid: 'wx94289b0d2ca7a802',
    secret: process.env.WECHAT_SECRET || 'mock_secret',
    useMock: true
  }
};
