const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取直播流列表
router.get('/admin/streams', (req, res) => {
  const streams = db.streams.getAll();
  res.json({ code: 0, data: { streams, total: streams.length }, timestamp: Date.now(), message: 'success' });
});

router.get('/v1/admin/streams', (req, res) => {
  const streams = db.streams.getAll();
  res.json({ code: 0, data: { streams, total: streams.length }, message: 'success' });
});

// 添加直播流
router.post('/admin/streams', (req, res) => {
  const { name, url, type, description, enabled } = req.body;
  if (!name || !url || !type) return res.status(400).json({ code: 400, message: 'name, url, type 必填' });
  if (!['hls', 'rtmp', 'flv'].includes(type)) return res.status(400).json({ code: 400, message: 'type 必须是 hls, rtmp 或 flv' });
  const stream = db.streams.add({ name: name.trim(), url: url.trim(), type, description: description || '', enabled: enabled !== false });
  res.json({ code: 0, data: stream, message: '直播流添加成功' });
});

// 更新直播流
router.put('/admin/streams/:id', (req, res) => {
  const updated = db.streams.update(req.params.id, { ...req.body, updatedAt: new Date().toISOString() });
  if (!updated) return res.status(404).json({ code: 404, message: '直播流不存在' });
  res.json({ code: 0, data: updated, message: '直播流更新成功' });
});

// 删除直播流
router.delete('/admin/streams/:id', (req, res) => {
  db.streams.delete(req.params.id);
  res.json({ code: 0, data: { id: req.params.id }, message: '直播流删除成功' });
});

// RTMP 地址生成
router.get('/admin/rtmp/urls', (req, res) => {
  const { room_name } = req.query;
  if (!room_name) return res.status(400).json({ code: 400, message: '房间名称不能为空' });
  res.json({
    code: 0,
    data: {
      room_name,
      push_url: `rtmp://localhost/live/${room_name}`,
      play_flv: `http://localhost:8086/live/${room_name}.flv`,
      play_hls: `http://localhost:8086/live/${room_name}.m3u8`
    },
    message: 'success'
  });
});

module.exports = router;
