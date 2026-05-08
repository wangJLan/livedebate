package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String nickName;
    private String avatarUrl;
    private String createdAt;
    private String updatedAt;
    private Integer totalVotes;
    private Integer joinedDebates;
    private String status;
}
