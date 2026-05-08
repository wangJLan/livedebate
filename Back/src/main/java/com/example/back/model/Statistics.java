package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Statistics {
    private Integer totalVotes;
    private Integer totalUsers;
    private Integer totalStreams;
    private Integer totalLiveDays;
    private List<DailyStat> dailyStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStat {
        private String date;
        private Integer votes;
        private Integer users;
        private Integer streams;
    }
}
