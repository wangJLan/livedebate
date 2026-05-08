package com.example.back.controller;

import com.example.back.model.*;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AIContentController {

    private final MockDataService mockDataService;

    public AIContentController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping("/ai-content")
    public ApiResponse<List<AIContent>> getAIContent() {
        List<AIContent> contentList = mockDataService.getAllAIContent();
        return ApiResponse.success(contentList);
    }

    @GetMapping("/admin/ai-content")
    public ApiResponse<List<AIContent>> getAdminAIContent() {
        List<AIContent> contentList = mockDataService.getAllAIContent();
        return ApiResponse.success(contentList);
    }

    @GetMapping("/admin/ai-content/list")
    public ApiResponse<Map<String, Object>> getAIContentList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {

        if (pageSize > 100) {
            return ApiResponse.error("pageSize最大值为100");
        }

        List<AIContent> allContent = mockDataService.getAllAIContent();

        // 按时间过滤
        List<AIContent> filteredContent = allContent.stream()
                .filter(content -> {
                    if (startTime != null && !startTime.isEmpty()) {
                        long itemTime = content.getTimestamp() != null ? content.getTimestamp() : 0;
                        long start = java.sql.Timestamp.valueOf(startTime.replace("T", " ").replace("Z", "")).getTime();
                        if (itemTime < start) return false;
                    }
                    if (endTime != null && !endTime.isEmpty()) {
                        long itemTime = content.getTimestamp() != null ? content.getTimestamp() : 0;
                        long end = java.sql.Timestamp.valueOf(endTime.replace("T", " ").replace("Z", "")).getTime();
                        if (itemTime > end) return false;
                    }
                    return true;
                })
                .toList();

        int total = filteredContent.size();
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, total);

        List<AIContent> paginatedContent = start < total ? filteredContent.subList(start, end) : List.of();

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("items", paginatedContent);
        result.put("timestamp", System.currentTimeMillis());

        return ApiResponse.success(result);
    }

    @GetMapping("/admin/ai-content/{id}")
    public ApiResponse<AIContent> getAIContentById(@PathVariable String id) {
        AIContent content = mockDataService.getAIContentById(id);
        if (content == null) {
            return ApiResponse.error("内容不存在");
        }
        return ApiResponse.success(content);
    }

    @PostMapping("/admin/ai-content")
    public ApiResponse<AIContent> createAIContent(@RequestBody AIContentRequest request) {
        if (request.getText() == null || request.getText().isEmpty()) {
            return ApiResponse.error("缺少必要参数: text");
        }
        if (request.getSide() == null || request.getSide().isEmpty()) {
            return ApiResponse.error("缺少必要参数: side");
        }
        if (!"left".equals(request.getSide()) && !"right".equals(request.getSide())) {
            return ApiResponse.error("side 必须是 \"left\" 或 \"right\"");
        }

        AIContent newContent = mockDataService.createAIContent(request.getText(), request.getSide());
        return ApiResponse.success("AI内容已创建", newContent);
    }

    @PutMapping("/admin/ai-content/{id}")
    public ApiResponse<AIContent> updateAIContent(
            @PathVariable String id,
            @RequestBody AIContentRequest request) {

        AIContent content = mockDataService.updateAIContent(
                id,
                request.getText(),
                request.getSide(),
                request.getDebateId()
        );

        if (content == null) {
            return ApiResponse.error("内容不存在");
        }
        return ApiResponse.success("AI内容已更新", content);
    }

    @DeleteMapping("/admin/ai-content/{id}")
    public ApiResponse<Map<String, Object>> deleteAIContent(@PathVariable String id) {
        boolean deleted = mockDataService.deleteAIContent(id);
        if (!deleted) {
            return ApiResponse.error("内容不存在");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "删除成功");
        return ApiResponse.success(result);
    }

    // ==================== 评论管理 ====================

    @PostMapping("/comment")
    public ApiResponse<Comment> addComment(@RequestBody CommentRequest request) {
        if (request.getContentId() == null || request.getContentId().isEmpty()) {
            return ApiResponse.error("缺少必要参数: contentId");
        }
        if (request.getText() == null || request.getText().trim().isEmpty()) {
            return ApiResponse.error("评论内容不能为空");
        }

        Comment comment = mockDataService.addComment(
                request.getContentId(),
                request.getUser(),
                request.getText(),
                request.getAvatar()
        );

        if (comment == null) {
            return ApiResponse.error("内容不存在");
        }
        return ApiResponse.success(comment);
    }

    @DeleteMapping("/comment/{commentId}")
    public ApiResponse<Void> deleteComment(
            @PathVariable String commentId,
            @RequestBody Map<String, String> body) {

        String contentId = body.get("contentId");
        if (commentId == null || contentId == null) {
            return ApiResponse.error("缺少必要参数: commentId 和 contentId");
        }

        boolean deleted = mockDataService.deleteComment(contentId, commentId);
        if (!deleted) {
            return ApiResponse.error("评论不存在");
        }
        return ApiResponse.success("评论已删除", null);
    }

    @GetMapping("/admin/ai-content/{id}/comments")
    public ApiResponse<Map<String, Object>> getComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer pageSize) {

        AIContent content = mockDataService.getAIContentById(id);
        if (content == null) {
            return ApiResponse.error("AI内容不存在");
        }

        List<Comment> comments = content.getComments() != null ? content.getComments() : List.of();
        int total = comments.size();
        int start = (page - 1) * pageSize;
        int end = Math.min(start + pageSize, total);

        List<Comment> paginatedComments = start < total ? comments.subList(start, end) : List.of();

        Map<String, Object> result = new HashMap<>();
        result.put("contentId", id);
        result.put("contentText", content.getText() != null ? content.getText() : "");
        result.put("total", total);
        result.put("page", page);
        result.put("pageSize", pageSize);
        result.put("comments", paginatedComments);
        result.put("timestamp", System.currentTimeMillis());

        return ApiResponse.success(result);
    }

    @DeleteMapping("/admin/ai-content/{id}/comments/{commentId}")
    public ApiResponse<Map<String, Object>> deleteAdminComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @RequestBody(required = false) Map<String, Object> body) {

        boolean deleted = mockDataService.deleteComment(id, commentId);
        if (!deleted) {
            return ApiResponse.error("评论不存在");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("contentId", id);
        result.put("commentId", commentId);
        result.put("deleted", true);

        return ApiResponse.success("评论已删除", result);
    }

    static class AIContentRequest {
        private String text;
        private String side;
        private String debateId;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getSide() {
            return side;
        }

        public void setSide(String side) {
            this.side = side;
        }

        public String getDebateId() {
            return debateId;
        }

        public void setDebateId(String debateId) {
            this.debateId = debateId;
        }
    }

    static class CommentRequest {
        private String contentId;
        private String user;
        private String text;
        private String avatar;

        public String getContentId() {
            return contentId;
        }

        public void setContentId(String contentId) {
            this.contentId = contentId;
        }

        public String getUser() {
            return user;
        }

        public void setUser(String user) {
            this.user = user;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getAvatar() {
            return avatar;
        }

        public void setAvatar(String avatar) {
            this.avatar = avatar;
        }
    }
}
