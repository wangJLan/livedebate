package com.example.back.controller;

import com.example.back.model.ApiResponse;
import com.example.back.model.AIContent;
import com.example.back.model.LiveStatus;
import com.example.back.model.Vote;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MiscController {

    private final MockDataService mockDataService;

    public MiscController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    // ==================== 点赞接口 ====================

    @PostMapping("/like")
    public ApiResponse<Map<String, Object>> like(@RequestBody Map<String, Object> request) {
        String contentId = (String) request.get("contentId");
        String commentId = request.containsKey("commentId") ? (String) request.get("commentId") : null;

        if (contentId == null || contentId.isEmpty()) {
            return ApiResponse.error("内容ID不能为空");
        }

        AIContent content = mockDataService.getAIContentById(contentId);
        if (content == null) {
            return ApiResponse.error("内容不存在");
        }

        // 点赞内容
        if (commentId == null || commentId.isEmpty()) {
            int currentLikes = content.getLikes() != null ? content.getLikes() : 0;
            content.setLikes(currentLikes + 1);
        } else {
            // 点赞评论
            if (content.getComments() != null) {
                content.getComments().stream()
                        .filter(comment -> comment.getId().equals(commentId))
                        .findFirst()
                        .ifPresent(comment -> {
                            int currentLikes = comment.getLikes() != null ? comment.getLikes() : 0;
                            comment.setLikes(currentLikes + 1);
                        });
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "点赞成功");
        result.put("contentId", contentId);
        if (commentId != null) {
            result.put("commentId", commentId);
        }

        return ApiResponse.success(result);
    }

    // ==================== RTMP转HLS接口 ====================

    @GetMapping("/admin/rtmp/urls")
    public ApiResponse<Map<String, Object>> getRtmpUrls(@RequestParam String room_name) {
        if (room_name == null || room_name.isEmpty()) {
            return ApiResponse.error("房间名称不能为空");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("room_name", room_name);
        result.put("push_url", "rtmp://localhost/live/" + room_name);
        result.put("play_flv", "http://localhost:8086/live/" + room_name + ".flv");
        result.put("play_hls", "http://localhost:8086/live/" + room_name + ".m3u8");

        return ApiResponse.success(result);
    }

    // ==================== 仪表盘接口 ====================

    @GetMapping("/admin/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard() {
        Vote votes = mockDataService.getVotes();
        LiveStatus status = mockDataService.getLiveStatus();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("isLive", status.getIsLive());
        dashboard.put("liveStreamUrl", status.getStreamUrl());
        dashboard.put("totalUsers", 1);
        dashboard.put("totalVotes", votes.getTotalVotes());
        dashboard.put("leftVotes", votes.getLeftVotes());
        dashboard.put("rightVotes", votes.getRightVotes());
        dashboard.put("timestamp", System.currentTimeMillis());

        return ApiResponse.success(dashboard);
    }
}
