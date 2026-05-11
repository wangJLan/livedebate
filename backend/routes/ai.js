const express = require('express');
const router = express.Router();
const db = require('../db');

// ==================== 公开接口 ====================

// 获取 AI 内容列表
router.get('/ai-content', (req, res) => {
  res.json({ code: 0, data: db.aiContent.getAll(), message: 'success' });
});

router.get('/v1/ai-content', (req, res) => {
  res.json({ code: 0, data: db.aiContent.getAll(), message: 'success' });
});

// ==================== 管理后台：AI 内容 CRUD ====================

router.get('/admin/ai-content', (req, res) => {
  res.json({ code: 0, data: db.aiContent.getAll(), message: 'success' });
});

// 分页列表（必须在 /:id 之前定义，避免路由冲突）
router.get('/admin/ai-content/list', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
  const { startTime, endTime } = req.query;

  let list = [...db.aiContent.getAll()];

  if (startTime) {
    const start = new Date(startTime).getTime();
    list = list.filter(item => (item.timestamp || 0) >= start);
  }
  if (endTime) {
    const end = new Date(endTime).getTime();
    list = list.filter(item => (item.timestamp || 0) <= end);
  }

  const total = list.length;
  list = list.slice((page - 1) * pageSize, page * pageSize);

  res.json({ code: 0, data: { total, page, pageSize, items: list }, timestamp: Date.now(), message: 'success' });
});

// v1 分页列表
router.get('/v1/admin/ai-content/list', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
  const { startTime, endTime, stream_id } = req.query;

  let list = [...db.aiContent.getAll()];
  if (stream_id) list = list.filter(i => !i.streamId || i.streamId === stream_id);
  if (startTime) list = list.filter(i => (i.timestamp || 0) >= new Date(startTime).getTime());
  if (endTime) list = list.filter(i => (i.timestamp || 0) <= new Date(endTime).getTime());

  const total = list.length;
  list = list.slice((page - 1) * pageSize, page * pageSize);

  const items = list.map(item => ({
    id: item.id,
    content: item.text || '',
    type: 'summary',
    timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
    position: item.side || 'left',
    confidence: item.confidence || 0.95,
    statistics: { views: 0, likes: item.likes || 0, comments: (item.comments || []).length }
  }));

  res.json({ code: 0, data: { total, page, items }, message: 'success' });
});

router.get('/admin/ai-content/:id', (req, res) => {
  const item = db.aiContent.getById(req.params.id);
  if (!item) return res.status(404).json({ code: 404, message: '内容不存在' });
  res.json({ code: 0, data: item, message: 'success' });
});

router.post('/admin/ai-content', (req, res) => {
  const { text, side } = req.body;
  if (!text || !side) return res.status(400).json({ code: 400, message: '缺少必要参数: text, side' });
  if (!['left', 'right'].includes(side)) return res.status(400).json({ code: 400, message: 'side 必须是 left 或 right' });
  const item = db.aiContent.add({ text: text.trim(), side, streamId: req.body.streamId || null });
  res.json({ code: 0, data: item, message: 'AI内容已创建' });
});

router.put('/admin/ai-content/:id', (req, res) => {
  const updated = db.aiContent.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ code: 404, message: '内容不存在' });
  res.json({ code: 0, data: updated, message: '内容已更新' });
});

router.delete('/admin/ai-content/:id', (req, res) => {
  db.aiContent.delete(req.params.id);
  res.json({ code: 0, data: { id: req.params.id }, message: '内容已删除' });
});

// ==================== 评论管理 ====================

router.post('/comment', (req, res) => {
  const { contentId, user, text, avatar } = req.body;
  if (!contentId || !text) return res.status(400).json({ code: 400, message: '缺少必要参数: contentId 和 text' });
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ code: 400, message: '评论内容不能为空' });

  const comment = db.aiContent.addComment(contentId, { nickname: user || '匿名用户', text: text.trim(), avatar: avatar || '👤' });
  if (!comment) return res.status(404).json({ code: 404, message: '内容不存在' });
  res.json({ code: 0, data: comment, message: '评论成功' });
});

router.delete('/comment/:commentId', (req, res) => {
  const { contentId } = req.body;
  if (!contentId) return res.status(400).json({ code: 400, message: '缺少 contentId' });
  const ok = db.aiContent.deleteComment(contentId, req.params.commentId);
  if (!ok) return res.status(404).json({ code: 404, message: '评论不存在' });
  res.json({ code: 0, data: { message: '评论已删除' }, message: 'success' });
});

// 管理后台评论接口
router.get('/admin/ai-content/:id/comments', (req, res) => {
  const item = db.aiContent.getById(req.params.id);
  if (!item) return res.status(404).json({ code: 404, message: '内容不存在' });
  const comments = item.comments || [];
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const paginated = comments.slice((page - 1) * pageSize, page * pageSize);

  res.json({
    code: 0,
    data: { contentId: req.params.id, contentText: item.text || '', total: comments.length, page, pageSize, comments: paginated },
    timestamp: Date.now(),
    message: 'success'
  });
});

router.delete('/admin/ai-content/:id/comments/:commentId', (req, res) => {
  const ok = db.aiContent.deleteComment(req.params.id, req.params.commentId);
  if (!ok) return res.status(404).json({ code: 404, message: '评论不存在' });
  res.json({ code: 0, data: { contentId: req.params.id, commentId: req.params.commentId, deleted: true }, message: '评论已删除' });
});

// v1 评论接口
router.get('/v1/admin/ai-content/:id/comments', (req, res) => {
  const item = db.aiContent.getById(req.params.id);
  if (!item) return res.status(404).json({ code: 404, message: 'AI内容不存在' });
  let comments = [...(item.comments || [])];
  comments.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const page = parseInt(req.query.page) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 100);
  const total = comments.length;
  comments = comments.slice((page - 1) * pageSize, page * pageSize);

  const formatted = comments.map(c => ({
    commentId: c.commentId || c.id,
    userId: c.userId || 'anonymous',
    nickname: c.nickname || '匿名用户',
    avatar: c.avatar || '👤',
    content: c.content || '',
    likes: c.likes || 0,
    timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString()
  }));

  res.json({ code: 0, data: { contentId: req.params.id, contentText: item.text || '', total, page, pageSize, comments: formatted }, message: 'success' });
});

router.delete('/v1/admin/ai-content/:id/comments/:commentId', (req, res) => {
  const ok = db.aiContent.deleteComment(req.params.id, req.params.commentId);
  if (!ok) return res.status(404).json({ code: 404, message: `评论ID ${req.params.commentId} 不存在` });
  res.json({ code: 0, data: { commentId: req.params.commentId, contentId: req.params.id, deleteTime: null }, message: '评论已删除' });
});

// ==================== 点赞 ====================

router.post('/like', (req, res) => {
  const { contentId, commentId } = req.body;
  if (!contentId) return res.status(400).json({ code: 400, message: '缺少 contentId' });
  const result = db.aiContent.like(contentId, commentId);
  if (!result) return res.status(404).json({ code: 404, message: commentId ? '评论不存在' : '内容不存在' });
  res.json({ code: 0, data: result, message: 'success' });
});

module.exports = router;
