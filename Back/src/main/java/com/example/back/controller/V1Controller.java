package com.example.back.controller;

import com.example.back.model.*;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class V1Controller {

    private final MockDataService mockDataService;

    public V1Controller(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    // ==================== 投票接口 ====================

    @GetMapping("/votes")
    public ApiResponse<Vote> getVotesWithStreamId(@RequestParam(required = false) String stream_id) {
        Vote votes = mockDataService.getVotes();
        return ApiResponse.success(votes);
    }

    @PostMapping("/user-vote")
    public ApiResponse<Vote> userVote(@RequestBody Map<String, Object> request) {
        Integer leftVotes = null;
        Integer rightVotes = null;

        // 支持多种请求格式
        if (request.containsKey("request")) {
            Map<String, Object> reqBody = (Map<String, Object>) request.get("request");
            leftVotes = reqBody.containsKey("leftVotes") ? ((Number) reqBody.get("leftVotes")).intValue() : null;
            rightVotes = reqBody.containsKey("rightVotes") ? ((Number) reqBody.get("rightVotes")).intValue() : null;
        } else {
            leftVotes = request.containsKey("leftVotes") ? ((Number) request.get("leftVotes")).intValue() : null;
            rightVotes = request.containsKey("rightVotes") ? ((Number) request.get("rightVotes")).intValue() : null;
        }

        Vote votes = mockDataService.updateVotes(leftVotes, rightVotes);
        return ApiResponse.success("投票成功", votes);
    }

    // ==================== 辩题接口 ====================

    @GetMapping("/debate-topic")
    public ApiResponse<DebateTopic> getDebateTopicWithStreamId(@RequestParam(required = false) String stream_id) {
        DebateTopic topic = mockDataService.getDebateTopic();
        return ApiResponse.success(topic);
    }

    // ==================== AI内容接口 ====================

    @GetMapping("/ai-content")
    public ApiResponse<List<AIContent>> getAiContentWithStreamId(@RequestParam(required = false) String stream_id) {
        List<AIContent> contentList = mockDataService.getAllAIContent();
        return ApiResponse.success(contentList);
    }

    // ==================== 用户投票记录接口 ====================

    @GetMapping("/user-votes")
    public ApiResponse<Vote> getUserVotes(
            @RequestParam String stream_id,
            @RequestParam String user_id) {
        Vote votes = mockDataService.getVotes();
        return ApiResponse.success(votes);
    }

    // ==================== 仪表盘接口 ====================

    @GetMapping("/admin/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard(@RequestParam(required = false) String stream_id) {
        Vote votes = mockDataService.getVotes();
        Statistics stats = mockDataService.getStatistics();
        LiveStatus liveStatus = mockDataService.getLiveStatus();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("isLive", liveStatus.getIsLive());
        dashboard.put("streamUrl", liveStatus.getStreamUrl());
        dashboard.put("totalUsers", stats.getTotalUsers());
        dashboard.put("totalVotes", votes.getTotalVotes());
        dashboard.put("leftVotes", votes.getLeftVotes());
        dashboard.put("rightVotes", votes.getRightVotes());
        dashboard.put("leftPercentage", votes.getLeftPercentage());
        dashboard.put("rightPercentage", votes.getRightPercentage());
        dashboard.put("timestamp", System.currentTimeMillis());

        return ApiResponse.success(dashboard);
    }

    // ==================== 直播流列表接口 ====================

    @GetMapping("/admin/streams")
    public ApiResponse<Map<String, Object>> getStreamsList() {
        List<Stream> streams = mockDataService.getAllStreams();

        Map<String, Object> result = new HashMap<>();
        result.put("streams", streams);
        result.put("total", streams.size());

        return ApiResponse.success(result);
    }

    // ==================== 投票统计接口 ====================

    @GetMapping("/admin/votes/statistics")
    public ApiResponse<Map<String, Object>> getVotesStatistics(@RequestParam(required = false) String stream_id) {
        Vote votes = mockDataService.getVotes();
        Statistics stats = mockDataService.getStatistics();

        Map<String, Object> result = new HashMap<>();
        result.put("totalVotes", votes.getTotalVotes());
        result.put("leftVotes", votes.getLeftVotes());
        result.put("rightVotes", votes.getRightVotes());
        result.put("leftPercentage", votes.getLeftPercentage());
        result.put("rightPercentage", votes.getRightPercentage());
        result.put("dailyStats", stats.getDailyStats());
        result.put("timestamp", System.currentTimeMillis());

        return ApiResponse.success(result);
    }
}
