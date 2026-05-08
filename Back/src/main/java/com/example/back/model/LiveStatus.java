package com.example.back.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiveStatus {
    private Boolean isLive;
    private String streamUrl;
    private String scheduledStartTime;
    private String scheduledEndTime;
    private String streamId;
    private Boolean isScheduled;
    private String liveId;
    private String startTime;
    private LiveSchedule schedule;
    private String activeStreamUrl;
    private String activeStreamId;
    private String activeStreamName;
}
