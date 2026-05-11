package com.example.back.service;

import com.example.back.model.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class MockDataService {

    // 当前票数
    private Vote currentVotes = new Vote(0, 0, 0, 50, 50);

    // 辩题信息
    private DebateTopic debateTopic = new DebateTopic(
            "debate-default-001",
            "如果有一个能一键消除痛苦的按钮，你会按吗？",
            "这是一个关于痛苦、成长与人性选择的深度辩论",
            "会按",
            "不会按"
    );

    // AI识别的辩论内容
    private final List<AIContent> aiDebateContent = new ArrayList<>();

    // 用户列表
    private final List<User> users = new ArrayList<>();

    // 直播流列表
    private final List<Stream> streams = new ArrayList<>();

    // 直播状态
    private LiveStatus globalLiveStatus = new LiveStatus();

    // 直播计划
    private LiveSchedule liveSchedule = new LiveSchedule(false, null, null, null);

    // 统计数据
    private Statistics statistics = new Statistics();

    public MockDataService() {
        initMockData();
    }

    private void initMockData() {
        // 初始化用户
        users.add(new User(
                "owaF-13Ueukqwd_EFJqS-jDTI9-U",
                "微信用户",
                "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
                "2025-11-17T07:06:24.322Z",
                "2025-11-17T07:06:24.324Z",
                0,
                0,
                "active"
        ));

        // 初始化直播流
        streams.add(new Stream(
                "stream-001",
                "主直播流",
                "rtmp://localhost/live/main",
                "rtmp",
                "主直播间推流地址",
                true,
                "2025-11-17T07:00:00.000Z"
        ));
        streams.add(new Stream(
                "stream-002",
                "备用直播流",
                "rtmp://localhost/live/backup",
                "rtmp",
                "备用直播间推流地址",
                false,
                "2025-11-17T07:00:00.000Z"
        ));

        // 初始化AI辩论内容
        initAIContent();

        // 初始化统计数据
        initStatistics();

        // 初始化直播状态
        globalLiveStatus.setIsLive(false);
        globalLiveStatus.setStreamUrl(null);
        globalLiveStatus.setIsScheduled(false);
    }

    private void initAIContent() {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_INSTANT;

        // 创建评论列表
        List<Comment> comments1 = Arrays.asList(
                new Comment(UUID.randomUUID().toString(), "user-1", "心理学家", "🧠", "痛苦确实能促进心理成长，但过度的痛苦也可能造成创伤", 15, LocalDateTime.now().minusMinutes(3).atZone(ZoneId.systemDefault()).toInstant().toString()),
                new Comment(UUID.randomUUID().toString(), "user-2", "哲学家", "🤔", "尼采说过，那些杀不死我们的，会让我们更强大", 23, LocalDateTime.now().minusMinutes(4).atZone(ZoneId.systemDefault()).toInstant().toString())
        );

        List<Comment> comments2 = Arrays.asList(
                new Comment(UUID.randomUUID().toString(), "user-3", "医生", "👨‍⚕️", "作为医生，我见过太多不必要的痛苦，如果能消除，我支持", 18, LocalDateTime.now().minusMinutes(2).atZone(ZoneId.systemDefault()).toInstant().toString()),
                new Comment(UUID.randomUUID().toString(), "user-4", "患者家属", "💝", "看着亲人痛苦，我多么希望有这样的按钮", 31, LocalDateTime.now().minusMinutes(3).atZone(ZoneId.systemDefault()).toInstant().toString())
        );

        List<Comment> comments3 = Arrays.asList(
                new Comment(UUID.randomUUID().toString(), "user-5", "社工", "🤝", "同理心确实需要痛苦的经历来培养", 12, LocalDateTime.now().minusMinutes(1).atZone(ZoneId.systemDefault()).toInstant().toString()),
                new Comment(UUID.randomUUID().toString(), "user-6", "作家", "📚", "很多伟大的文学作品都源于作者的痛苦经历", 19, LocalDateTime.now().minusMinutes(2).atZone(ZoneId.systemDefault()).toInstant().toString())
        );

        List<Comment> comments4 = Arrays.asList(
                new Comment(UUID.randomUUID().toString(), "user-7", "教育工作者", "👩‍🏫", "教育确实可以培养同理心，不一定需要亲身经历痛苦", 16, LocalDateTime.now().minusMinutes(1).atZone(ZoneId.systemDefault()).toInstant().toString()),
                new Comment(UUID.randomUUID().toString(), "user-8", "心理咨询师", "💭", "区分痛苦和负面情绪很重要，这个按钮可能只针对真正的痛苦", 8, LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toString())
        );

        List<Comment> comments5 = Arrays.asList(
                new Comment(UUID.randomUUID().toString(), "user-9", "神学家", "⛪", "痛苦在宗教和哲学中都有其深层意义", 14, LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toString())
        );

        aiDebateContent.add(new AIContent(
                UUID.randomUUID().toString(),
                debateTopic.getId(),
                null,
                "正方观点：痛苦是人生成长的必要经历，消除痛苦会让我们失去学习和成长的机会。",
                "left",
                "left",
                System.currentTimeMillis() - 300000,
                45,
                0.95,
                comments1,
                new AIContent.Statistics(120, 45, 2)
        ));

        aiDebateContent.add(new AIContent(
                UUID.randomUUID().toString(),
                debateTopic.getId(),
                null,
                "反方观点：如果能够消除痛苦，为什么不呢？痛苦本身没有价值，消除痛苦可以让人更专注于积极的事情。",
                "right",
                "right",
                System.currentTimeMillis() - 240000,
                52,
                0.92,
                comments2,
                new AIContent.Statistics(150, 52, 2)
        ));

        aiDebateContent.add(new AIContent(
                UUID.randomUUID().toString(),
                debateTopic.getId(),
                null,
                "正方回应：痛苦让我们学会同理心，如果所有人都没有痛苦经历，我们如何理解他人的苦难？",
                "left",
                "left",
                System.currentTimeMillis() - 180000,
                38,
                0.90,
                comments3,
                new AIContent.Statistics(100, 38, 2)
        ));

        aiDebateContent.add(new AIContent(
                UUID.randomUUID().toString(),
                debateTopic.getId(),
                null,
                "反方回应：我们可以通过其他方式培养同理心，比如阅读、教育。消除痛苦不等于消除所有负面情绪。",
                "right",
                "right",
                System.currentTimeMillis() - 120000,
                41,
                0.88,
                comments4,
                new AIContent.Statistics(110, 41, 2)
        ));

        aiDebateContent.add(new AIContent(
                UUID.randomUUID().toString(),
                debateTopic.getId(),
                null,
                "正方总结：痛苦是人性的一部分，消除痛苦可能会让我们失去作为人的完整性。",
                "left",
                "left",
                System.currentTimeMillis() - 60000,
                29,
                0.96,
                comments5,
                new AIContent.Statistics(80, 29, 1)
        ));
    }

    private void initStatistics() {
        statistics.setTotalVotes(100);
        statistics.setTotalUsers(1);
        statistics.setTotalStreams(2);
        statistics.setTotalLiveDays(5);

        List<Statistics.DailyStat> dailyStats = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 4; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            dailyStats.add(new Statistics.DailyStat(
                    date.format(dateFormatter),
                    20 + new Random().nextInt(30),
                    5 + new Random().nextInt(15),
                    1 + new Random().nextInt(2)
            ));
        }
        statistics.setDailyStats(dailyStats);
    }

    // ==================== 票数管理 ====================

    public Vote getVotes() {
        int total = currentVotes.getLeftVotes() + currentVotes.getRightVotes();
        int leftPercent = total > 0 ? Math.round((currentVotes.getLeftVotes() * 100.0f) / total) : 50;
        int rightPercent = total > 0 ? Math.round((currentVotes.getRightVotes() * 100.0f) / total) : 50;

        return new Vote(
                currentVotes.getLeftVotes(),
                currentVotes.getRightVotes(),
                total,
                leftPercent,
                rightPercent
        );
    }

    public Vote updateVotes(Integer leftVotes, Integer rightVotes) {
        if (leftVotes != null && leftVotes >= 0) {
            currentVotes.setLeftVotes(leftVotes);
        }
        if (rightVotes != null && rightVotes >= 0) {
            currentVotes.setRightVotes(rightVotes);
        }
        return getVotes();
    }

    public Vote resetVotes() {
        currentVotes.setLeftVotes(0);
        currentVotes.setRightVotes(0);
        return getVotes();
    }

    // ==================== 辩题管理 ====================

    public DebateTopic getDebateTopic() {
        return debateTopic;
    }

    public DebateTopic updateDebateTopic(DebateTopic topic) {
        if (topic.getTitle() != null) {
            debateTopic.setTitle(topic.getTitle());
        }
        if (topic.getDescription() != null) {
            debateTopic.setDescription(topic.getDescription());
        }
        if (topic.getLeftPosition() != null) {
            debateTopic.setLeftPosition(topic.getLeftPosition());
        }
        if (topic.getRightPosition() != null) {
            debateTopic.setRightPosition(topic.getRightPosition());
        }
        return debateTopic;
    }

    // ==================== AI内容管理 ====================

    public List<AIContent> getAllAIContent() {
        return new ArrayList<>(aiDebateContent);
    }

    public AIContent getAIContentById(String id) {
        return aiDebateContent.stream()
                .filter(content -> content.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public AIContent createAIContent(String text, String side) {
        AIContent newContent = new AIContent();
        newContent.setId(UUID.randomUUID().toString());
        newContent.setDebateId(debateTopic.getId());
        newContent.setText(text.trim());
        newContent.setSide(side);
        newContent.setPosition(side);
        newContent.setTimestamp(System.currentTimeMillis());
        newContent.setComments(new ArrayList<>());
        newContent.setLikes(0);
        newContent.setConfidence(0.95);

        aiDebateContent.add(newContent);
        return newContent;
    }

    public AIContent updateAIContent(String id, String text, String side, String debateId) {
        for (AIContent content : aiDebateContent) {
            if (content.getId().equals(id)) {
                if (text != null) {
                    content.setText(text.trim());
                }
                if (side != null && ("left".equals(side) || "right".equals(side))) {
                    content.setSide(side);
                    content.setPosition(side);
                }
                if (debateId != null) {
                    content.setDebateId(debateId);
                }
                return content;
            }
        }
        return null;
    }

    public boolean deleteAIContent(String id) {
        return aiDebateContent.removeIf(content -> content.getId().equals(id));
    }

    // ==================== 评论管理 ====================

    public Comment addComment(String contentId, String user, String text, String avatar) {
        for (AIContent content : aiDebateContent) {
            if (content.getId().equals(contentId)) {
                Comment newComment = new Comment();
                newComment.setId(UUID.randomUUID().toString());
                newComment.setNickname(user != null ? user : "匿名用户");
                newComment.setUserId("anonymous");
                newComment.setContent(text.trim());
                newComment.setAvatar(avatar != null ? avatar : "👤");
                newComment.setLikes(0);
                newComment.setTimestamp(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toString());

                if (content.getComments() == null) {
                    content.setComments(new ArrayList<>());
                }
                content.getComments().add(newComment);

                // 更新统计
                if (content.getStatistics() == null) {
                    content.setStatistics(new AIContent.Statistics(0, 0, 0));
                }
                content.getStatistics().setComments(content.getComments().size());

                return newComment;
            }
        }
        return null;
    }

    public boolean deleteComment(String contentId, String commentId) {
        for (AIContent content : aiDebateContent) {
            if (content.getId().equals(contentId) && content.getComments() != null) {
                boolean removed = content.getComments().removeIf(
                        comment -> comment.getId().equals(commentId)
                );
                if (removed && content.getStatistics() != null) {
                    content.getStatistics().setComments(content.getComments().size());
                }
                return removed;
            }
        }
        return false;
    }

    // ==================== 用户管理 ====================

    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }

    public User getUserById(String id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    // ==================== 直播流管理 ====================

    public List<Stream> getAllStreams() {
        return new ArrayList<>(streams);
    }

    public Stream getStreamById(String id) {
        return streams.stream()
                .filter(stream -> stream.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public Stream getActiveStream() {
        return streams.stream()
                .filter(stream -> Boolean.TRUE.equals(stream.getEnabled()))
                .findFirst()
                .orElse(null);
    }

    // ==================== 直播状态管理 ====================

    public LiveStatus getLiveStatus() {
        LiveStatus status = new LiveStatus();
        status.setIsLive(globalLiveStatus.getIsLive());
        status.setStreamUrl(globalLiveStatus.getStreamUrl());
        status.setStreamId(globalLiveStatus.getStreamId());
        status.setIsScheduled(globalLiveStatus.getIsScheduled());
        status.setScheduledStartTime(globalLiveStatus.getScheduledStartTime());
        status.setScheduledEndTime(globalLiveStatus.getScheduledEndTime());
        status.setLiveId(globalLiveStatus.getLiveId());
        status.setStartTime(globalLiveStatus.getStartTime());
        status.setSchedule(liveSchedule);

        Stream activeStream = getActiveStream();
        if (activeStream != null) {
            status.setActiveStreamUrl(activeStream.getUrl());
            status.setActiveStreamId(activeStream.getId());
            status.setActiveStreamName(activeStream.getName());
        }

        return status;
    }

    public LiveStatus startLive(String streamUrl) {
        if (streamUrl == null || streamUrl.isEmpty()) {
            Stream activeStream = getActiveStream();
            if (activeStream != null) {
                streamUrl = activeStream.getUrl();
                globalLiveStatus.setStreamId(activeStream.getId());
            } else {
                return null;
            }
        }

        globalLiveStatus.setIsLive(true);
        globalLiveStatus.setStreamUrl(streamUrl);
        globalLiveStatus.setIsScheduled(false);
        globalLiveStatus.setScheduledStartTime(null);
        globalLiveStatus.setScheduledEndTime(null);
        globalLiveStatus.setStartTime(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toString());
        globalLiveStatus.setLiveId(UUID.randomUUID().toString());

        // 清除计划
        liveSchedule.setIsScheduled(false);
        liveSchedule.setScheduledStartTime(null);
        liveSchedule.setScheduledEndTime(null);
        liveSchedule.setStreamId(null);

        return getLiveStatus();
    }

    public LiveStatus stopLive() {
        globalLiveStatus.setIsLive(false);
        globalLiveStatus.setStreamUrl(null);
        globalLiveStatus.setStreamId(null);
        globalLiveStatus.setStartTime(null);
        globalLiveStatus.setLiveId(null);

        // 清除计划
        liveSchedule.setIsScheduled(false);
        liveSchedule.setScheduledStartTime(null);
        liveSchedule.setScheduledEndTime(null);
        liveSchedule.setStreamId(null);

        globalLiveStatus.setIsScheduled(false);
        globalLiveStatus.setScheduledStartTime(null);
        globalLiveStatus.setScheduledEndTime(null);

        return getLiveStatus();
    }

    public LiveSchedule setLiveSchedule(String scheduledStartTime, String scheduledEndTime, String streamId) {
        if (streamId != null && !streamId.isEmpty()) {
            Stream stream = getStreamById(streamId);
            if (stream == null || !Boolean.TRUE.equals(stream.getEnabled())) {
                return null;
            }
            liveSchedule.setStreamId(streamId);
        } else {
            Stream activeStream = getActiveStream();
            if (activeStream == null) {
                return null;
            }
            liveSchedule.setStreamId(activeStream.getId());
        }

        liveSchedule.setIsScheduled(true);
        liveSchedule.setScheduledStartTime(scheduledStartTime);
        liveSchedule.setScheduledEndTime(scheduledEndTime);

        globalLiveStatus.setIsScheduled(true);
        globalLiveStatus.setScheduledStartTime(scheduledStartTime);
        globalLiveStatus.setScheduledEndTime(scheduledEndTime);
        globalLiveStatus.setStreamId(liveSchedule.getStreamId());

        return liveSchedule;
    }

    public LiveSchedule getLiveSchedule() {
        return liveSchedule;
    }

    public LiveSchedule cancelLiveSchedule() {
        liveSchedule.setIsScheduled(false);
        liveSchedule.setScheduledStartTime(null);
        liveSchedule.setScheduledEndTime(null);
        liveSchedule.setStreamId(null);

        globalLiveStatus.setIsScheduled(false);
        globalLiveStatus.setScheduledStartTime(null);
        globalLiveStatus.setScheduledEndTime(null);

        return liveSchedule;
    }

    // ==================== 统计管理 ====================

    public Statistics getStatistics() {
        return statistics;
    }

    public Statistics getStatisticsSummary() {
        Statistics summary = new Statistics();
        summary.setTotalVotes(statistics.getTotalVotes());
        summary.setTotalUsers(statistics.getTotalUsers());
        summary.setTotalStreams(statistics.getTotalStreams());
        summary.setTotalLiveDays(statistics.getDailyStats() != null ? statistics.getDailyStats().size() : 0);
        return summary;
    }

    public List<Statistics.DailyStat> getDailyStatistics() {
        return statistics.getDailyStats() != null ? statistics.getDailyStats() : new ArrayList<>();
    }

    // ==================== 模拟实时数据变化 ====================

    public void simulateVoteChanges() {
        if (Boolean.TRUE.equals(globalLiveStatus.getIsLive())) {
            Random random = new Random();
            int leftIncrease = random.nextInt(5) + 1;
            int rightIncrease = random.nextInt(5) + 1;

            currentVotes.setLeftVotes(currentVotes.getLeftVotes() + leftIncrease);
            currentVotes.setRightVotes(currentVotes.getRightVotes() + rightIncrease);
            statistics.setTotalVotes(statistics.getTotalVotes() + leftIncrease + rightIncrease);
        }
    }
}
