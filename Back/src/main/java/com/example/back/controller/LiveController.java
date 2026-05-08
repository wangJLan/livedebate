package com.example.back.controller;

import com.example.back.model.*;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LiveController {

    private final MockDataService mockDataService;

    public LiveController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping("/admin/live/status")
    public LiveStatus getAdminLiveStatus() {
        return mockDataService.getLiveStatus();
    }

    @PostMapping("/admin/live/control")
    public ApiResponse<Map<String, Object>> adminControlLive(@RequestBody LiveControlRequest request) {
        String action = request.getAction();

        if ("start".equals(action)) {
            LiveStatus status = mockDataService.startLive(request.getStreamUrl());
            if (status == null) {
                return ApiResponse.error("没有可用的直播流");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("status", "started");
            result.put("streamUrl", status.getStreamUrl());
            return ApiResponse.success(result);
        } else if ("stop".equals(action)) {
            mockDataService.stopLive();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("status", "stopped");
            return ApiResponse.success(result);
        } else {
            return ApiResponse.error("无效的操作");
        }
    }

    @PostMapping("/live/control")
    public ApiResponse<Map<String, Object>> userControlLive(@RequestBody LiveControlRequest request) {
        String action = request.getAction();

        if ("start".equals(action)) {
            Stream selectedStream = null;

            if (request.getStreamId() != null && !request.getStreamId().isEmpty()) {
                selectedStream = mockDataService.getStreamById(request.getStreamId());
                if (selectedStream == null) {
                    return ApiResponse.error("指定的直播流不存在");
                }
                if (!Boolean.TRUE.equals(selectedStream.getEnabled())) {
                    return ApiResponse.error("指定的直播流未启用");
                }
            } else {
                selectedStream = mockDataService.getActiveStream();
                if (selectedStream == null) {
                    return ApiResponse.error("没有可用的直播流，请先在后台管理系统中配置直播流");
                }
            }

            LiveStatus status = mockDataService.startLive(selectedStream.getUrl());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "直播已开始");
            result.put("data", Map.of(
                    "status", "started",
                    "streamUrl", status.getStreamUrl(),
                    "streamId", selectedStream.getId(),
                    "streamName", selectedStream.getName()
            ));
            return ApiResponse.success(result);
        } else if ("stop".equals(action)) {
            mockDataService.stopLive();

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "直播已停止");
            result.put("data", Map.of("status", "stopped"));
            return ApiResponse.success(result);
        } else {
            return ApiResponse.error("无效的操作，action 必须是 \"start\" 或 \"stop\"");
        }
    }

    @PostMapping("/admin/live/schedule")
    public ApiResponse<LiveSchedule> setLiveSchedule(@RequestBody ScheduleRequest request) {
        if (request.getScheduledStartTime() == null || request.getScheduledStartTime().isEmpty()) {
            return ApiResponse.error("请设置直播开始时间");
        }

        // 简单验证时间格式
        try {
            java.time.Instant.parse(request.getScheduledStartTime());
        } catch (Exception e) {
            return ApiResponse.error("开始时间格式不正确，应为ISO 8601格式");
        }

        LiveSchedule schedule = mockDataService.setLiveSchedule(
                request.getScheduledStartTime(),
                request.getScheduledEndTime(),
                request.getStreamId()
        );

        if (schedule == null) {
            return ApiResponse.error("设置直播计划失败");
        }

        return ApiResponse.success("直播计划已设置", schedule);
    }

    @GetMapping("/admin/live/schedule")
    public ApiResponse<LiveSchedule> getLiveSchedule() {
        LiveSchedule schedule = mockDataService.getLiveSchedule();
        return ApiResponse.success(schedule);
    }

    @PostMapping("/admin/live/schedule/cancel")
    public ApiResponse<Void> cancelLiveSchedule() {
        mockDataService.cancelLiveSchedule();
        return ApiResponse.success("直播计划已取消", null);
    }

    @PostMapping("/admin/live/setup-and-start")
    public ApiResponse<Map<String, Object>> setupAndStart(@RequestBody SetupAndStartRequest request) {
        Stream selectedStream = null;

        if (request.getStreamId() != null && !request.getStreamId().isEmpty()) {
            selectedStream = mockDataService.getStreamById(request.getStreamId());
            if (selectedStream == null) {
                return ApiResponse.error("指定的直播流不存在");
            }
            if (!Boolean.TRUE.equals(selectedStream.getEnabled())) {
                return ApiResponse.error("指定的直播流未启用");
            }
        } else {
            selectedStream = mockDataService.getActiveStream();
            if (selectedStream == null) {
                return ApiResponse.error("没有可用的直播流");
            }
        }

        if (Boolean.TRUE.equals(request.getStartNow())) {
            // 立即开始
            LiveStatus status = mockDataService.startLive(selectedStream.getUrl());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "直播已开始");
            result.put("data", Map.of(
                    "isLive", true,
                    "streamUrl", status.getStreamUrl(),
                    "streamId", selectedStream.getId()
            ));
            return ApiResponse.success(result);
        } else {
            // 设置定时
            if (request.getScheduledStartTime() == null || request.getScheduledStartTime().isEmpty()) {
                return ApiResponse.error("请设置直播开始时间");
            }

            try {
                java.time.Instant.parse(request.getScheduledStartTime());
            } catch (Exception e) {
                return ApiResponse.error("开始时间格式不正确");
            }

            LiveSchedule schedule = mockDataService.setLiveSchedule(
                    request.getScheduledStartTime(),
                    request.getScheduledEndTime(),
                    selectedStream.getId()
            );

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "直播计划已设置");
            result.put("data", schedule);
            return ApiResponse.success(result);
        }
    }

    // ==================== v1 API ====================

    @GetMapping("/v1/admin/ai-content/list")
    public ApiResponse<Map<String, Object>> getV1AIContentList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {

        if (pageSize > 100) {
            return ApiResponse.error("pageSize最大值为100");
        }

        List<AIContent> allContent = mockDataService.getAllAIContent();

        List<AIContent> filteredContent = allContent.stream()
                .filter(content -> {
                    if (startTime != null && !startTime.isEmpty()) {
                        long itemTime = content.getTimestamp() != null ? content.getTimestamp() : 0;
                        try {
                            long start = java.time.Instant.parse(startTime).toEpochMilli();
                            if (itemTime < start) return false;
                        } catch (Exception ignored) {
                        }
                    }
                    if (endTime != null && !endTime.isEmpty()) {
                        long itemTime = content.getTimestamp() != null ? content.getTimestamp() : 0;
                        try {
                            long end = java.time.Instant.parse(endTime).toEpochMilli();
                            if (itemTime > end) return false;
                        } catch (Exception ignored) {
                        }
                    }
                    return true;
                })
                .toList();

        int total = filteredContent.size();
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, total);

        List<AIContent> paginatedContent = start < total ? filteredContent.subList(start, end) : List.of();

        List<Map<String, Object>> items = paginatedContent.stream().map(content -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", content.getId());
            item.put("content", content.getText() != null ? content.getText() : "");
            item.put("type", "summary");
            item.put("timestamp", content.getTimestamp() != null ?
                    java.time.Instant.ofEpochMilli(content.getTimestamp()).toString() :
                    java.time.Instant.now().toString());
            item.put("position", content.getSide() != null ? content.getSide() : "left");
            item.put("confidence", content.getConfidence() != null ? content.getConfidence() : 0.95);

            int commentCount = content.getComments() != null ? content.getComments().size() : 0;
            item.put("statistics", Map.of(
                    "views", content.getStatistics() != null ? content.getStatistics().getViews() : 0,
                    "likes", content.getLikes() != null ? content.getLikes() : 0,
                    "comments", commentCount
            ));
            return item;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("page", page);
        result.put("items", items);

        return ApiResponse.success(result);
    }

    @GetMapping("/v1/admin/ai-content/{id}/comments")
    public ApiResponse<Map<String, Object>> getV1Comments(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {

        if (pageSize > 100) {
            return ApiResponse.error("pageSize最大值为100");
        }

        AIContent content = mockDataService.getAIContentById(id);
        if (content == null) {
            return ApiResponse.error("AI内容不存在");
        }

        List<Comment> comments = content.getComments() != null ? content.getComments() : List.of();

        // 按时间倒序排序
        List<Comment> sortedComments = comments.stream()
                .sorted((a, b) -> {
                    long tsA = parseTimestamp(a.getTimestamp());
                    long tsB = parseTimestamp(b.getTimestamp());
                    return Long.compare(tsB, tsA);
                })
                .toList();

        int total = sortedComments.size();
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, total);

        List<Comment> paginatedComments = start < total ? sortedComments.subList(start, end) : List.of();

        List<Map<String, Object>> formattedComments = paginatedComments.stream().map(comment -> {
            Map<String, Object> formatted = new HashMap<>();
            formatted.put("commentId", comment.getId());
            formatted.put("userId", comment.getUserId() != null ? comment.getUserId() : "anonymous");
            formatted.put("nickname", comment.getNickname() != null ? comment.getNickname() : "匿名用户");
            formatted.put("avatar", comment.getAvatar() != null ? comment.getAvatar() : "👤");
            formatted.put("content", comment.getContent() != null ? comment.getContent() : "");
            formatted.put("likes", comment.getLikes() != null ? comment.getLikes() : 0);

            String timestamp = comment.getTimestamp();
            if (timestamp != null) {
                formatted.put("timestamp", timestamp);
            } else {
                formatted.put("timestamp", java.time.Instant.now().toString());
            }
            return formatted;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("contentId", id);
        result.put("contentText", content.getText() != null ? content.getText() : "");
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("comments", formattedComments);

        return ApiResponse.success(result);
    }

    @DeleteMapping("/v1/admin/ai-content/{id}/comments/{commentId}")
    public ApiResponse<Map<String, Object>> deleteV1Comment(
            @PathVariable String id,
            @PathVariable String commentId,
            @RequestBody(required = false) Map<String, Object> body) {

        boolean deleted = mockDataService.deleteComment(id, commentId);
        if (!deleted) {
            return ApiResponse.error("评论ID " + commentId + " 不存在或不属于内容ID " + id);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("commentId", commentId);
        result.put("contentId", id);
        result.put("deleteTime", null);

        return ApiResponse.success("评论已删除", result);
    }

    private long parseTimestamp(String timestamp) {
        if (timestamp == null) return 0;
        try {
            return java.time.Instant.parse(timestamp).toEpochMilli();
        } catch (Exception e) {
            return 0;
        }
    }

    static class LiveControlRequest {
        private String action;
        private String streamUrl;
        private String streamId;

        public String getAction() {
            return action;
        }

        public void setAction(String action) {
            this.action = action;
        }

        public String getStreamUrl() {
            return streamUrl;
        }

        public void setStreamUrl(String streamUrl) {
            this.streamUrl = streamUrl;
        }

        public String getStreamId() {
            return streamId;
        }

        public void setStreamId(String streamId) {
            this.streamId = streamId;
        }
    }

    static class ScheduleRequest {
        private String scheduledStartTime;
        private String scheduledEndTime;
        private String streamId;

        public String getScheduledStartTime() {
            return scheduledStartTime;
        }

        public void setScheduledStartTime(String scheduledStartTime) {
            this.scheduledStartTime = scheduledStartTime;
        }

        public String getScheduledEndTime() {
            return scheduledEndTime;
        }

        public void setScheduledEndTime(String scheduledEndTime) {
            this.scheduledEndTime = scheduledEndTime;
        }

        public String getStreamId() {
            return streamId;
        }

        public void setStreamId(String streamId) {
            this.streamId = streamId;
        }
    }

    static class SetupAndStartRequest {
        private String streamId;
        private String scheduledStartTime;
        private String scheduledEndTime;
        private Boolean startNow;

        public String getStreamId() {
            return streamId;
        }

        public void setStreamId(String streamId) {
            this.streamId = streamId;
        }

        public String getScheduledStartTime() {
            return scheduledStartTime;
        }

        public void setScheduledStartTime(String scheduledStartTime) {
            this.scheduledStartTime = scheduledStartTime;
        }

        public String getScheduledEndTime() {
            return scheduledEndTime;
        }

        public void setScheduledEndTime(String scheduledEndTime) {
            this.scheduledEndTime = scheduledEndTime;
        }

        public Boolean getStartNow() {
            return startNow;
        }

        public void setStartNow(Boolean startNow) {
            this.startNow = startNow;
        }
    }
}
