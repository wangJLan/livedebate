// 基于 JSON 文件的轻量数据库
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_DIR = path.join(__dirname, '../data');

const FILES = {
  streams: path.join(DB_DIR, 'streams.json'),
  debate: path.join(DB_DIR, 'debate.json'),
  users: path.join(DB_DIR, 'users.json'),
  statistics: path.join(DB_DIR, 'statistics.json'),
  liveSchedule: path.join(DB_DIR, 'live-schedule.json'),
  aiContent: path.join(DB_DIR, 'ai-content.json'),
  votes: path.join(DB_DIR, 'votes.json')
};

// ==================== 初始化 ====================

function init() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const defaults = {
    streams: [],
    debate: {
      id: 'debate-default-001',
      title: '如果有一个能一键消除痛苦的按钮，你会按吗？',
      description: '这是一个关于痛苦、成长与人性选择的深度辩论',
      leftPosition: '会按',
      rightPosition: '不会按'
    },
    users: [],
    statistics: { totalVotes: 0, totalUsers: 0, totalStreams: 0, totalLiveDays: 0, dailyStats: [] },
    liveSchedule: { isScheduled: false, scheduledStartTime: null, scheduledEndTime: null, streamId: null },
    aiContent: [],
    votes: { leftVotes: 0, rightVotes: 0 }
  };

  for (const [key, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaults[key], null, 2));
    }
  }
}

function read(key) {
  try {
    return JSON.parse(fs.readFileSync(FILES[key], 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') { init(); return read(key); }
    throw e;
  }
}

function write(key, data) {
  fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2));
}

init();

// ==================== 辩题 ====================

const debate = {
  get: () => read('debate'),
  update: (data) => {
    const current = read('debate');
    const updated = { ...current, ...data };
    write('debate', updated);
    return updated;
  }
};

// ==================== 用户 ====================

const users = {
  getAll: () => read('users'),
  getById: (id) => read('users').find(u => u.id === id) || null,
  createOrUpdate: (userData) => {
    const all = read('users');
    const idx = all.findIndex(u => u.id === userData.id);
    if (idx === -1) {
      const newUser = { ...userData, createdAt: new Date().toISOString(), totalVotes: 0, joinedDebates: 0, status: 'active' };
      all.push(newUser);
      write('users', all);
      return newUser;
    }
    all[idx] = { ...all[idx], ...userData, updatedAt: new Date().toISOString() };
    write('users', all);
    return all[idx];
  }
};

// ==================== 直播流 ====================

const streams = {
  getAll: () => read('streams'),
  getById: (id) => read('streams').find(s => s.id === id) || null,
  getActive: () => read('streams').find(s => s.enabled === true) || null,
  add: (data) => {
    const all = read('streams');
    const s = { id: `stream-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    all.push(s);
    write('streams', all);
    updateStats();
    return s;
  },
  update: (id, data) => {
    const all = read('streams');
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    write('streams', all);
    return all[idx];
  },
  delete: (id) => {
    const all = read('streams').filter(s => s.id !== id);
    write('streams', all);
    updateStats();
    return true;
  }
};

// ==================== 票数 ====================

const votes = {
  get: () => read('votes'),
  update: (leftVotes, rightVotes) => {
    const v = read('votes');
    if (leftVotes !== undefined && leftVotes !== null) v.leftVotes = leftVotes;
    if (rightVotes !== undefined && rightVotes !== null) v.rightVotes = rightVotes;
    write('votes', v);
    return v;
  },
  reset: () => write('votes', { leftVotes: 0, rightVotes: 0 })
};

// ==================== AI 内容 ====================

const aiContent = {
  getAll: () => read('aiContent'),
  getById: (id) => read('aiContent').find(c => c.id === id) || null,
  add: (data) => {
    const all = read('aiContent');
    const item = {
      id: uuidv4(),
      debateId: data.debateId || debate.get().id,
      text: data.text,
      side: data.side,
      timestamp: Date.now(),
      comments: [],
      likes: Math.floor(Math.random() * 30) + 10,
      confidence: 0.85 + Math.random() * 0.14
    };
    all.unshift(item);
    write('aiContent', all);
    return item;
  },
  update: (id, data) => {
    const all = read('aiContent');
    const idx = all.findIndex(c => c.id === id);
    if (idx === -1) return null;
    if (data.text !== undefined) all[idx].text = data.text;
    if (data.side !== undefined) all[idx].side = data.side;
    write('aiContent', all);
    return all[idx];
  },
  delete: (id) => {
    const all = read('aiContent').filter(c => c.id !== id);
    write('aiContent', all);
    return true;
  },
  addComment: (contentId, comment) => {
    const all = read('aiContent');
    const item = all.find(c => c.id === contentId);
    if (!item) return null;
    const c = {
      id: uuidv4(),
      userId: comment.userId || 'anonymous',
      nickname: comment.nickname || '匿名用户',
      avatar: comment.avatar || '👤',
      content: comment.text,
      likes: 0,
      timestamp: new Date().toISOString()
    };
    item.comments.push(c);
    write('aiContent', all);
    return c;
  },
  deleteComment: (contentId, commentId) => {
    const all = read('aiContent');
    const item = all.find(c => c.id === contentId);
    if (!item) return false;
    const before = item.comments.length;
    item.comments = item.comments.filter(c => c.id !== commentId || c.commentId !== commentId);
    write('aiContent', all);
    return item.comments.length < before;
  },
  like: (contentId, commentId) => {
    const all = read('aiContent');
    const item = all.find(c => c.id === contentId);
    if (!item) return null;
    if (commentId) {
      const comment = item.comments.find(c => c.id === commentId || c.commentId === commentId);
      if (!comment) return null;
      comment.likes = (comment.likes || 0) + 1;
      write('aiContent', all);
      return { likes: comment.likes };
    }
    item.likes = (item.likes || 0) + 1;
    write('aiContent', all);
    return { likes: item.likes };
  }
};

// ==================== 统计 ====================

function updateStats() {
  const stats = read('statistics');
  stats.totalStreams = read('streams').length;
  write('statistics', stats);
}

const statistics = {
  get: () => read('statistics'),
  incrementVotes: (count) => {
    const stats = read('statistics');
    stats.totalVotes = (stats.totalVotes || 0) + count;
    write('statistics', stats);
    return stats;
  },
  updateDashboard: (data) => {
    const stats = read('statistics');
    Object.assign(stats, data, { updatedAt: new Date().toISOString() });
    write('statistics', stats);
    return stats;
  }
};

// ==================== 直播计划 ====================

const liveSchedule = {
  get: () => read('liveSchedule'),
  update: (data) => {
    const updated = { ...read('liveSchedule'), ...data, updatedAt: new Date().toISOString() };
    write('liveSchedule', updated);
    return updated;
  },
  clear: () => {
    const cleared = { isScheduled: false, scheduledStartTime: null, scheduledEndTime: null, streamId: null, updatedAt: new Date().toISOString() };
    write('liveSchedule', cleared);
    return cleared;
  }
};

module.exports = { debate, users, streams, votes, aiContent, statistics, liveSchedule, read, write };
