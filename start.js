// 直播辩论系统 - 启动脚本
// 同时启动 backend(:3000) 和 gateway

const { spawn } = require('child_process');
const http = require('http');
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

function waitForBackend(url, retries, cb) {
  http.get(url, (res) => {
    if (res.statusCode === 200) {
      cb();
    } else {
      retry();
    }
  }).on('error', () => retry());

  function retry() {
    if (retries > 0) {
      setTimeout(() => waitForBackend(url, retries - 1, cb), 1000);
    } else {
      console.log('⚠️ Backend 未就绪，仍然启动 Gateway...');
      cb();
    }
  }
}

console.log('🚀 直播辩论系统启动中...\n');

// 启动后端服务 (:3000)
const backend = startService('Backend', 'backend', 'app.js');

// 等待 backend 健康检查通过后再启动 gateway
waitForBackend('http://localhost:3000/health', 15, () => {
  console.log('✅ Backend 已就绪，启动 Gateway...\n');
  const gateway = startService('Gateway', 'live-gateway', 'gateway.js');

  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务...');
    backend.kill();
    gateway.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务...');
    backend.kill();
    gateway.kill();
    process.exit(0);
  });
});
