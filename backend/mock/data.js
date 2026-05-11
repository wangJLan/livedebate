// Mock 数据初始化模块
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const DEBATE_TOPIC = db.debate.get();

/**
 * 生成初始 mock AI 辩论内容
 */
function initAIContent() {
  const existing = db.aiContent.getAll();
  if (existing.length > 0) return; // 已有数据则跳过

  const mockItems = [
    {
      id: uuidv4(),
      debateId: DEBATE_TOPIC.id,
      text: '正方观点：痛苦是人生成长的必要经历，消除痛苦会让我们失去学习和成长的机会。',
      side: 'left',
      timestamp: Date.now() - 300000,
      likes: 45,
      confidence: 0.95,
      comments: [
        { id: uuidv4(), userId: 'user-1', nickname: '心理学家', avatar: '🧠', content: '痛苦确实能促进心理成长，但过度的痛苦也可能造成创伤', likes: 15, timestamp: new Date(Date.now() - 180000).toISOString() },
        { id: uuidv4(), userId: 'user-2', nickname: '哲学家', avatar: '🤔', content: '尼采说过，那些杀不死我们的，会让我们更强大', likes: 23, timestamp: new Date(Date.now() - 240000).toISOString() }
      ]
    },
    {
      id: uuidv4(),
      debateId: DEBATE_TOPIC.id,
      text: '反方观点：如果能够消除痛苦，为什么不呢？痛苦本身没有价值，消除痛苦可以让人更专注于积极的事情。',
      side: 'right',
      timestamp: Date.now() - 240000,
      likes: 52,
      confidence: 0.92,
      comments: [
        { id: uuidv4(), userId: 'user-3', nickname: '医生', avatar: '👨‍⚕️', content: '作为医生，我见过太多不必要的痛苦，如果能消除，我支持', likes: 18, timestamp: new Date(Date.now() - 120000).toISOString() },
        { id: uuidv4(), userId: 'user-4', nickname: '患者家属', avatar: '💝', content: '看着亲人痛苦，我多么希望有这样的按钮', likes: 31, timestamp: new Date(Date.now() - 180000).toISOString() }
      ]
    },
    {
      id: uuidv4(),
      debateId: DEBATE_TOPIC.id,
      text: '正方回应：痛苦让我们学会同理心，如果所有人都没有痛苦经历，我们如何理解他人的苦难？',
      side: 'left',
      timestamp: Date.now() - 180000,
      likes: 38,
      confidence: 0.90,
      comments: [
        { id: uuidv4(), userId: 'user-5', nickname: '社工', avatar: '🤝', content: '同理心确实需要痛苦的经历来培养', likes: 12, timestamp: new Date(Date.now() - 60000).toISOString() },
        { id: uuidv4(), userId: 'user-6', nickname: '作家', avatar: '📚', content: '很多伟大的文学作品都源于作者的痛苦经历', likes: 19, timestamp: new Date(Date.now() - 120000).toISOString() }
      ]
    },
    {
      id: uuidv4(),
      debateId: DEBATE_TOPIC.id,
      text: '反方回应：我们可以通过其他方式培养同理心，比如阅读、教育。消除痛苦不等于消除所有负面情绪。',
      side: 'right',
      timestamp: Date.now() - 120000,
      likes: 41,
      confidence: 0.88,
      comments: [
        { id: uuidv4(), userId: 'user-7', nickname: '教育工作者', avatar: '👩‍🏫', content: '教育确实可以培养同理心，不一定需要亲身经历痛苦', likes: 16, timestamp: new Date(Date.now() - 60000).toISOString() },
        { id: uuidv4(), userId: 'user-8', nickname: '心理咨询师', avatar: '💭', content: '区分痛苦和负面情绪很重要，这个按钮可能只针对真正的痛苦', likes: 8, timestamp: new Date().toISOString() }
      ]
    },
    {
      id: uuidv4(),
      debateId: DEBATE_TOPIC.id,
      text: '正方总结：痛苦是人性的一部分，消除痛苦可能会让我们失去作为人的完整性。',
      side: 'left',
      timestamp: Date.now() - 60000,
      likes: 29,
      confidence: 0.96,
      comments: [
        { id: uuidv4(), userId: 'user-9', nickname: '神学家', avatar: '⛪', content: '痛苦在宗教和哲学中都有其深层意义', likes: 14, timestamp: new Date().toISOString() }
      ]
    }
  ];

  mockItems.forEach(item => {
    const all = db.read('aiContent');
    all.push(item);
    db.write('aiContent', all);
  });
}

/**
 * 初始化 mock 用户
 */
function initUsers() {
  const existing = db.users.getAll();
  if (existing.length > 0) return;

  db.users.createOrUpdate({
    id: 'mock_user_001',
    nickName: '微信用户_Zhang',
    avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
  });
}

/**
 * 初始化 mock 直播流
 */
function initStreams() {
  const existing = db.streams.getAll();
  if (existing.length > 0) return;

  db.streams.add({ name: '主直播流', url: 'rtmp://localhost/live/main', type: 'rtmp', description: '主直播间推流地址', enabled: true });
  db.streams.add({ name: '备用直播流', url: 'rtmp://localhost/live/backup', type: 'rtmp', description: '备用直播间推流地址', enabled: false });
}

/**
 * 初始化统计数据
 */
function initStatistics() {
  const stats = db.statistics.get();
  if (stats.dailyStats && stats.dailyStats.length > 0) return;

  const dailyStats = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyStats.push({
      date: d.toISOString().split('T')[0],
      votes: 20 + Math.floor(Math.random() * 30),
      users: 5 + Math.floor(Math.random() * 15),
      streams: 1 + Math.floor(Math.random() * 2)
    });
  }

  db.statistics.updateDashboard({
    totalVotes: 100,
    totalUsers: 1,
    totalStreams: 2,
    totalLiveDays: 7,
    dailyStats
  });
}

/**
 * 初始化所有 mock 数据
 */
function initAll() {
  console.log('📦 初始化 Mock 数据...');
  initStreams();
  initUsers();
  initAIContent();
  initStatistics();
  console.log('✅ Mock 数据初始化完成');
}

module.exports = { initAll };
