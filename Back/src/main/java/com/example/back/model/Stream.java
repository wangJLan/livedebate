package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Stream {
    private String id;
    private String name;
    private String url;
    private String type;
    private String description;
    private Boolean enabled;
    private String createdAt;
}
