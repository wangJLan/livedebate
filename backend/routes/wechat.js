const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');

// 微信登录
router.post('/wechat-login', async (req, res) => {
  const { code, userInfo } = req.body;
  if (!code) return res.status(400).json({ code: 400, message: '缺少必要参数: code' });

  // Mock 模式：生成模拟 openid
  const openid = 'mock_openid_' + Date.now();
  const session_key = 'mock_session_key_' + Math.random().toString(36).substr(2, 9);

  // 保存用户
  if (userInfo && userInfo.nickName) {
    db.users.createOrUpdate({
      id: openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl || ''
    });
  }

  res.json({
    code: 0,
    data: {
      openid,
      session_key,
      userInfo: userInfo || { nickName: '微信用户', avatarUrl: '' },
      loginTime: new Date().toISOString(),
      isMock: true
    },
    message: 'success'
  });
});

module.exports = router;
