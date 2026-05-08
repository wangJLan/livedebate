package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vote {
    private Integer leftVotes;
    private Integer rightVotes;
    private Integer totalVotes;
    private Integer leftPercentage;
    private Integer rightPercentage;
}
