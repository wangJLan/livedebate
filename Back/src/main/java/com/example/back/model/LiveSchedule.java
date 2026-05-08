package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiveSchedule {
    private Boolean isScheduled;
    private String scheduledStartTime;
    private String scheduledEndTime;
    private String streamId;
}
