package com.example.back.controller;

import com.example.back.model.ApiResponse;
import com.example.back.model.DebateTopic;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class DebateController {

    private final MockDataService mockDataService;

    public DebateController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping("/debate-topic")
    public ApiResponse<DebateTopic> getDebateTopic() {
        DebateTopic topic = mockDataService.getDebateTopic();
        return ApiResponse.success(topic);
    }

    @GetMapping("/admin/debate")
    public ApiResponse<DebateTopic> getAdminDebate() {
        DebateTopic topic = mockDataService.getDebateTopic();
        return ApiResponse.success(topic);
    }

    @PutMapping("/admin/debate")
    public ApiResponse<DebateTopic> updateDebateTopic(@RequestBody DebateTopic request) {
        DebateTopic topic = mockDataService.updateDebateTopic(request);
        return ApiResponse.success("辩题已更新", topic);
    }
}
