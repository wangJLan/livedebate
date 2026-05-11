// 直播辩论系统 - 启动脚本
// 同时启动 backend(:3000) 和 gateway(:3001)

const { spawn } = require('child_process');
const path = require('path');

function startService(name, dir, script) {
  const child = spawn('node', [script], {
    cwd: path.join(__dirname, dir),
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error(`[${name}] 启动失败:`, err.message);
  });

  child.on('exit', (code) => {
    console.log(`[${name}] 进程退出, 退出码: ${code}`);
  });

  return child;
}

console.log('🚀 直播辩论系统启动中...\n');

// 启动后端服务 (:3000)
const backend = startService('Backend', 'backend', 'app.js');

// 等待 backend 启动后再启动 gateway
setTimeout(() => {
  const gateway = startService('Gateway', 'live-gateway', 'gateway.js');

  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务...');
    backend.kill();
    gateway.kill();
    process.exit(0);
  });
}, 2000);
