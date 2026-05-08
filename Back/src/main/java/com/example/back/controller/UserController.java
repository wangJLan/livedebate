package com.example.back.controller;

import com.example.back.model.ApiResponse;
import com.example.back.model.User;
import com.example.back.service.MockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    private final MockDataService mockDataService;

    public UserController(MockDataService mockDataService) {
        this.mockDataService = mockDataService;
    }

    @GetMapping
    public ApiResponse<List<User>> getAllUsers() {
        List<User> users = mockDataService.getAllUsers();
        return ApiResponse.success(users);
    }

    @GetMapping("/{id}")
    public ApiResponse<User> getUserById(@PathVariable String id) {
        User user = mockDataService.getUserById(id);
        if (user == null) {
            return ApiResponse.error("用户不存在");
        }
        return ApiResponse.success(user);
    }
}
