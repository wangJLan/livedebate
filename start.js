// 直播辩论系统 - 启动脚本
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 直播辩论系统启动中...\n');

const gateway = spawn('node', ['gateway.js'], {
  cwd: path.join(__dirname, 'live-gateway'),
  stdio: 'inherit',
  shell: true
});

gateway.on('error', (err) => {
  console.error('[Gateway] 启动失败:', err.message);
});

gateway.on('exit', (code) => {
  console.log(`[Gateway] 进程退出, 退出码: ${code}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务...');
  gateway.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务...');
  gateway.kill();
  process.exit(0);
});
