const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取辩题
router.get('/debate-topic', (req, res) => {
  const topic = db.debate.get();
  res.json({ code: 0, data: { id: topic.id, title: topic.title, description: topic.description, leftPosition: topic.leftPosition, rightPosition: topic.rightPosition }, message: 'success' });
});

router.get('/v1/debate-topic', (req, res) => {
  const topic = db.debate.get();
  res.json({ code: 0, data: topic, message: 'success' });
});

// 管理员辩题接口
router.get('/admin/debate', (req, res) => {
  res.json({ code: 0, data: db.debate.get(), message: 'success' });
});

router.put('/admin/debate', (req, res) => {
  const updated = db.debate.update(req.body);
  res.json({ code: 0, data: updated, message: '辩题已更新' });
});

module.exports = router;
