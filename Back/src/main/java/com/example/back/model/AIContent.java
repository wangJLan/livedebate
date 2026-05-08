package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIContent {
    private String id;
    private String debateId;
    private String content;
    private String text;
    private String side;
    private String position;
    private Long timestamp;
    private Integer likes;
    private Double confidence;
    private List<Comment> comments;
    private Statistics statistics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Statistics {
        private Integer views;
        private Integer likes;
        private Integer comments;
    }
}
