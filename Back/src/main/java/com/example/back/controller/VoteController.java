package com.example.back.controller;

import com.example.back.model.ApiResponse;
import com.example.back.model.Vote;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VoteController {

    private final MockDataService mockDataService;

    public VoteController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping("/votes")
    public ApiResponse<Vote> getVotes() {
        Vote votes = mockDataService.getVotes();
        return ApiResponse.success(votes);
    }

    @GetMapping("/admin/votes")
    public ApiResponse<Vote> getAdminVotes() {
        Vote votes = mockDataService.getVotes();
        return ApiResponse.success(votes);
    }

    @PutMapping("/admin/votes")
    public ApiResponse<Vote> updateVotes(@RequestBody VoteRequest request) {
        Vote votes = mockDataService.updateVotes(request.getLeftVotes(), request.getRightVotes());
        return ApiResponse.success("票数已更新", votes);
    }

    @PostMapping("/admin/votes/reset")
    public ApiResponse<Vote> resetVotes() {
        Vote votes = mockDataService.resetVotes();
        return ApiResponse.success("票数已重置", votes);
    }

    static class VoteRequest {
        private Integer leftVotes;
        private Integer rightVotes;

        public Integer getLeftVotes() {
            return leftVotes;
        }

        public void setLeftVotes(Integer leftVotes) {
            this.leftVotes = leftVotes;
        }

        public Integer getRightVotes() {
            return rightVotes;
        }

        public void setRightVotes(Integer rightVotes) {
            this.rightVotes = rightVotes;
        }
    }
}
