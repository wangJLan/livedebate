package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebateTopic {
    private String id;
    private String title;
    private String description;
    private String leftPosition;
    private String rightPosition;
}
