const express = require('express');
const router = express.Router();
const db = require('../db');

// 内存中的实时直播状态（重启会丢失，但基础数据在 JSON 里）
let liveStatus = { isLive: false, streamUrl: null, streamId: null, liveId: null, startTime: null, isScheduled: false, scheduledStartTime: null, scheduledEndTime: null };

// ==================== 直播状态 ====================

router.get('/admin/live/status', (req, res) => {
  const activeStream = db.streams.getActive();
  const schedule = db.liveSchedule.get();
  res.json({
    code: 0,
    data: {
      ...liveStatus,
      schedule,
      activeStreamUrl: activeStream ? activeStream.url : null,
      activeStreamId: activeStream ? activeStream.id : null,
      activeStreamName: activeStream ? activeStream.name : null
    },
    message: 'success'
  });
});

// ==================== 直播控制（管理员） ====================

router.post('/admin/live/control', (req, res) => {
  const { action, streamUrl } = req.body;
  if (action === 'start') {
    let url = streamUrl;
    if (!url) {
      const active = db.streams.getActive();
      if (!active) return res.status(400).json({ code: 400, message: '没有可用的直播流' });
      url = active.url;
    }
    liveStatus = { ...liveStatus, isLive: true, streamUrl: url, startTime: new Date().toISOString(), liveId: require('uuid').v4() };
    return res.json({ code: 0, data: { status: 'started', streamUrl: url }, message: 'success' });
  }
  if (action === 'stop') {
    liveStatus = { ...liveStatus, isLive: false, streamUrl: null, streamId: null, liveId: null, startTime: null };
    return res.json({ code: 0, data: { status: 'stopped' }, message: 'success' });
  }
  res.status(400).json({ code: 400, message: '无效的操作' });
});

// 公开直播控制
router.post('/live/control', (req, res) => {
  const { action, streamId } = req.body;
  if (action === 'start') {
    let stream;
    if (streamId) {
      stream = db.streams.getById(streamId);
      if (!stream) return res.status(400).json({ code: 400, message: '直播流不存在' });
      if (!stream.enabled) return res.status(400).json({ code: 400, message: '该流未启用' });
    } else {
      stream = db.streams.getActive();
      if (!stream) return res.status(400).json({ code: 400, message: '没有可用直播流' });
    }
    liveStatus = { isLive: true, streamUrl: stream.url, streamId: stream.id, liveId: require('uuid').v4(), startTime: new Date().toISOString(), isScheduled: false, scheduledStartTime: null, scheduledEndTime: null };
    db.liveSchedule.clear();
    return res.json({ code: 0, data: { status: 'started', streamUrl: stream.url, streamId: stream.id, streamName: stream.name }, message: '直播已开始' });
  }
  if (action === 'stop') {
    liveStatus = { isLive: false, streamUrl: null, streamId: null, liveId: null, startTime: null, isScheduled: false, scheduledStartTime: null, scheduledEndTime: null };
    return res.json({ code: 0, data: { status: 'stopped' }, message: '直播已停止' });
  }
  res.status(400).json({ code: 400, message: '无效操作' });
});

// ==================== v1 直播控制 ====================

router.post('/admin/live/start', (req, res) => {
  const { streamId } = req.body;
  const stream = streamId ? db.streams.getById(streamId) : db.streams.getActive();
  if (!stream) return res.status(400).json({ code: 400, message: '没有可用的直播流' });
  liveStatus = { ...liveStatus, isLive: true, streamUrl: stream.url, streamId: stream.id, liveId: require('uuid').v4(), startTime: new Date().toISOString() };
  res.json({ code: 0, data: { liveId: liveStatus.liveId, streamUrl: stream.url, status: 'started', startTime: liveStatus.startTime }, message: '直播已开始', timestamp: Date.now() });
});

router.post('/v1/admin/live/start', (req, res) => {
  const { streamId } = req.body;
  const stream = streamId ? db.streams.getById(streamId) : db.streams.getActive();
  if (!stream) return res.status(400).json({ code: 400, message: '没有可用的直播流' });
  liveStatus = { ...liveStatus, isLive: true, streamUrl: stream.url, streamId: stream.id, liveId: require('uuid').v4(), startTime: new Date().toISOString() };
  res.json({ code: 0, data: { liveId: liveStatus.liveId, streamUrl: stream.url, status: 'started', startTime: liveStatus.startTime }, message: '直播已开始', timestamp: Date.now() });
});

router.post('/admin/live/stop', (req, res) => {
  const stopTime = new Date().toISOString();
  const startTime = liveStatus.startTime;
  const duration = startTime ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) : 0;
  liveStatus = { ...liveStatus, isLive: false, streamUrl: null, streamId: null, liveId: null, startTime: null };
  res.json({ code: 0, data: { status: 'stopped', stopTime, duration }, message: '直播已停止', timestamp: Date.now() });
});

router.post('/v1/admin/live/stop', (req, res) => {
  const stopTime = new Date().toISOString();
  liveStatus = { ...liveStatus, isLive: false, streamUrl: null, streamId: null, liveId: null, startTime: null };
  res.json({ code: 0, data: { status: 'stopped', stopTime }, message: '直播已停止', timestamp: Date.now() });
});

// ==================== 直播计划 ====================

router.get('/admin/live/schedule', (req, res) => {
  res.json({ code: 0, data: db.liveSchedule.get(), message: 'success' });
});

router.post('/admin/live/schedule', (req, res) => {
  const { scheduledStartTime, scheduledEndTime, streamId } = req.body;
  if (!scheduledStartTime) return res.status(400).json({ code: 400, message: '请设置开始时间' });
  if (new Date(scheduledStartTime).getTime() <= Date.now()) return res.status(400).json({ code: 400, message: '开始时间必须晚于当前时间' });
  const schedule = db.liveSchedule.update({ scheduledStartTime, scheduledEndTime: scheduledEndTime || null, streamId: streamId || null, isScheduled: true });
  liveStatus = { ...liveStatus, isScheduled: true, scheduledStartTime, scheduledEndTime: scheduledEndTime || null, streamId: streamId || null };
  res.json({ code: 0, data: schedule, message: '计划已设置' });
});

router.post('/admin/live/schedule/cancel', (req, res) => {
  db.liveSchedule.clear();
  liveStatus = { ...liveStatus, isScheduled: false, scheduledStartTime: null, scheduledEndTime: null };
  res.json({ code: 0, data: { message: '计划已取消' } });
});

router.post('/admin/live/setup-and-start', (req, res) => {
  const { streamId, scheduledStartTime, scheduledEndTime, startNow } = req.body;
  const stream = streamId ? db.streams.getById(streamId) : db.streams.getActive();
  if (!stream) return res.status(400).json({ code: 400, message: '没有可用直播流' });

  if (startNow) {
    liveStatus = { ...liveStatus, isLive: true, streamUrl: stream.url, streamId: stream.id, liveId: require('uuid').v4(), startTime: new Date().toISOString() };
    db.liveSchedule.clear();
    return res.json({ code: 0, data: { isLive: true, streamUrl: stream.url, streamId: stream.id }, message: '直播已开始' });
  }
  if (!scheduledStartTime) return res.status(400).json({ code: 400, message: '请设置开始时间' });
  const schedule = db.liveSchedule.update({ scheduledStartTime, scheduledEndTime: scheduledEndTime || null, streamId: stream.id, isScheduled: true });
  res.json({ code: 0, data: schedule, message: '计划已设置' });
});

module.exports = router;
