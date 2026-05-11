const express = require('express');
const router = express.Router();
const db = require('../db');

function formatVote(v) {
  const total = v.leftVotes + v.rightVotes;
  return {
    leftVotes: v.leftVotes,
    rightVotes: v.rightVotes,
    totalVotes: total,
    leftPercentage: total > 0 ? Math.round((v.leftVotes / total) * 100) : 50,
    rightPercentage: total > 0 ? Math.round((v.rightVotes / total) * 100) : 50
  };
}

// 获取票数
router.get('/votes', (req, res) => {
  res.json({ code: 0, data: formatVote(db.votes.get()), message: 'success' });
});

router.get('/v1/votes', (req, res) => {
  res.json({ code: 0, data: formatVote(db.votes.get()), message: 'success' });
});

// 用户投票（支持两种格式：100票分配制和增量投票）
function handleUserVote(req, res) {
  const data = req.body.request || req.body;
  const { side, votes, leftVotes, rightVotes, userId } = data;
  let addLeft = 0, addRight = 0, mode = '';

  if (leftVotes !== undefined && rightVotes !== undefined) {
    mode = '100票分配制';
    addLeft = parseInt(leftVotes) || 0;
    addRight = parseInt(rightVotes) || 0;
    if (addLeft + addRight !== 100) {
      return res.status(400).json({ code: 400, message: `票数必须等于100，当前 ${addLeft}+${addRight}=${addLeft + addRight}` });
    }
  } else if (side && votes !== undefined) {
    mode = '增量投票';
    const count = parseInt(votes) || 10;
    if (count < 1 || count > 1000) {
      return res.status(400).json({ code: 400, message: '投票数量必须在 1-1000 之间' });
    }
    if (side === 'left') addLeft = count;
    else addRight = count;
  } else {
    return res.status(400).json({ code: 400, message: '请提供 { leftVotes, rightVotes } 或 { side, votes }' });
  }

  const current = db.votes.get();
  const updated = db.votes.update(current.leftVotes + addLeft, current.rightVotes + addRight);
  if (userId) db.users.createOrUpdate({ id: userId, totalVotes: addLeft + addRight + (db.users.getById(userId)?.totalVotes || 0) });
  db.statistics.incrementVotes(addLeft + addRight);

  res.json({ code: 0, data: formatVote(updated), message: `投票成功 (${mode})` });
}

router.post('/user-vote', handleUserVote);
router.post('/v1/user-vote', handleUserVote);

// 管理员票数接口
router.get('/admin/votes', (req, res) => {
  res.json({ code: 0, data: formatVote(db.votes.get()), message: 'success' });
});

router.put('/admin/votes', (req, res) => {
  const { leftVotes, rightVotes } = req.body;
  if (leftVotes !== undefined && (typeof leftVotes !== 'number' || leftVotes < 0)) {
    return res.status(400).json({ code: 400, message: 'leftVotes 必须是非负数' });
  }
  if (rightVotes !== undefined && (typeof rightVotes !== 'number' || rightVotes < 0)) {
    return res.status(400).json({ code: 400, message: 'rightVotes 必须是非负数' });
  }
  const updated = db.votes.update(leftVotes, rightVotes);
  res.json({ code: 0, data: formatVote(updated), message: '票数已更新' });
});

router.post('/admin/votes/reset', (req, res) => {
  db.votes.reset();
  res.json({ code: 0, data: formatVote(db.votes.get()), message: '票数已重置' });
});

router.get('/admin/votes/statistics', (req, res) => {
  const v = db.votes.get();
  const stats = db.statistics.get();
  res.json({
    code: 0,
    data: {
      summary: { ...formatVote(v), growthRate: 5.2 },
      timeline: [],
      topVoters: []
    },
    message: 'success'
  });
});

router.get('/v1/admin/votes/statistics', (req, res) => {
  const v = db.votes.get();
  const stats = db.statistics.get();
  res.json({
    code: 0,
    data: {
      totalVotes: formatVote(v).totalVotes,
      leftVotes: v.leftVotes,
      rightVotes: v.rightVotes,
      leftPercentage: formatVote(v).leftPercentage,
      rightPercentage: formatVote(v).rightPercentage,
      dailyStats: stats.dailyStats || [],
      timestamp: Date.now()
    },
    message: 'success'
  });
});

router.get('/v1/user-votes', (req, res) => {
  res.json({ code: 0, data: formatVote(db.votes.get()), message: 'success' });
});

module.exports = router;
