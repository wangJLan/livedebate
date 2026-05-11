const express = require('express');
const router = express.Router();
const db = require('../db');

// ==================== 用户管理 ====================

router.get('/admin/users', (req, res) => {
  res.json({ code: 0, data: db.users.getAll(), message: 'success' });
});

router.get('/admin/users/:id', (req, res) => {
  const user = db.users.getById(req.params.id);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
  res.json({ code: 0, data: user, message: 'success' });
});

// 小程序用户列表（兼容 gateway 格式）
router.get('/admin/miniprogram/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const users = db.users.getAll();
  const total = users.length;
  const paged = users.slice((page - 1) * pageSize, page * pageSize);

  res.json({
    code: 0,
    data: {
      total, page, pageSize,
      users: paged.map(u => ({
        userId: u.id,
        nickname: u.nickName || u.nickname,
        avatar: u.avatarUrl || u.avatarUrl,
        status: u.status || 'active',
        lastActiveTime: new Date().toISOString(),
        statistics: { totalVotes: u.totalVotes || 0, totalComments: 0, totalLikes: 0, currentPosition: 'neutral' },
        joinTime: u.createdAt || new Date().toISOString()
      }))
    },
    timestamp: Date.now(),
    message: 'success'
  });
});

// ==================== 统计 ====================

router.get('/admin/statistics/summary', (req, res) => {
  const stats = db.statistics.get();
  const users = db.users.getAll();
  const streams = db.streams.getAll();
  res.json({
    code: 0,
    data: {
      totalVotes: stats.totalVotes || 0,
      totalUsers: users.length,
      totalStreams: streams.length,
      totalLiveDays: (stats.dailyStats || []).length
    },
    message: 'success'
  });
});

router.get('/admin/statistics/daily', (req, res) => {
  const stats = db.statistics.get();
  res.json({ code: 0, data: stats.dailyStats || [], message: 'success' });
});

// ==================== 仪表盘 ====================

router.get('/admin/dashboard', (req, res) => {
  const v = db.votes.get();
  const users = db.users.getAll();
  const debate = db.debate.get();
  const total = v.leftVotes + v.rightVotes;

  res.json({
    code: 0,
    data: {
      totalUsers: users.length,
      activeUsers: users.length,
      isLive: false,
      liveStreamUrl: null,
      streamId: null,
      totalVotes: total,
      leftVotes: v.leftVotes,
      rightVotes: v.rightVotes,
      leftPercentage: total > 0 ? Math.round((v.leftVotes / total) * 100) : 50,
      rightPercentage: total > 0 ? Math.round((v.rightVotes / total) * 100) : 50,
      totalComments: 0,
      totalLikes: 0,
      aiStatus: 'stopped',
      debateTopic: {
        title: debate.title,
        leftSide: debate.leftPosition,
        rightSide: debate.rightPosition,
        description: debate.description
      },
      liveStartTime: null,
      liveDuration: 0
    },
    timestamp: Date.now(),
    message: 'success'
  });
});

router.get('/v1/admin/dashboard', (req, res) => {
  const v = db.votes.get();
  const total = v.leftVotes + v.rightVotes;
  res.json({
    code: 0,
    data: {
      isLive: false,
      streamUrl: null,
      totalUsers: db.users.getAll().length,
      totalVotes: total,
      leftVotes: v.leftVotes,
      rightVotes: v.rightVotes,
      leftPercentage: total > 0 ? Math.round((v.leftVotes / total) * 100) : 50,
      rightPercentage: total > 0 ? Math.round((v.rightVotes / total) * 100) : 50,
      timestamp: Date.now()
    },
    message: 'success'
  });
});

// ==================== AI 控制（简化版） ====================

router.post('/admin/ai/start', (req, res) => {
  res.json({ code: 0, data: { aiSessionId: require('uuid').v4(), status: 'running', startTime: new Date().toISOString() }, message: 'AI识别已启动', timestamp: Date.now() });
});

router.post('/admin/ai/stop', (req, res) => {
  res.json({ code: 0, data: { status: 'stopped' }, message: 'AI识别已停止', timestamp: Date.now() });
});

router.post('/admin/ai/toggle', (req, res) => {
  const { action } = req.body;
  if (!['pause', 'resume'].includes(action)) return res.status(400).json({ code: 400, message: 'action 必须是 pause 或 resume' });
  res.json({ code: 0, data: { status: action === 'pause' ? 'paused' : 'running' }, message: action === 'pause' ? 'AI已暂停' : 'AI已恢复', timestamp: Date.now() });
});

router.delete('/admin/ai/content/:contentId', (req, res) => {
  res.json({ code: 0, data: { contentId: req.params.contentId, deleteTime: new Date().toISOString() }, message: '内容已删除', timestamp: Date.now() });
});

module.exports = router;
