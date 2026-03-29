package com.kanux.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class VerifyCompanyController {

    @PostMapping("/verify-company")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("company", body.get("slug"));
        resp.put("exists", true);
        return ResponseEntity.ok(resp);
    }
}

