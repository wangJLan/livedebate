package com.example.back.controller;

import com.example.back.model.ApiResponse;
import com.example.back.model.Statistics;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/statistics")
public class StatisticsController {

    private final MockDataService mockDataService;

    public StatisticsController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping("/summary")
    public ApiResponse<Statistics> getSummary() {
        Statistics summary = mockDataService.getStatisticsSummary();
        return ApiResponse.success(summary);
    }

    @GetMapping("/daily")
    public ApiResponse<List<Statistics.DailyStat>> getDailyStats() {
        List<Statistics.DailyStat> dailyStats = mockDataService.getDailyStatistics();
        return ApiResponse.success(dailyStats);
    }
}
