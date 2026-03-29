package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.LoginRequest;
import com.kanux.dto.VerifyCompanyRequest;
import com.kanux.entity.Company;
import com.kanux.repository.CompanyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final CompanyRepository companyRepository;

    public AuthController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<Map<String, String>>> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("message", "Use Supabase auth token in Authorization header")));
    }

    @PostMapping("/verify-company")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyCompany(@RequestBody VerifyCompanyRequest req) {
        if (req.getSlug() == null || req.getSlug().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.fail("slug is required"));

        Optional<Company> company = companyRepository.findBySlugOrNumber(req.getSlug().trim());
        if (company.isEmpty())
            return ResponseEntity.ok(ApiResponse.fail("Empresa não encontrada"));

        Company c = company.get();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id", c.getId().toString(),
                "name", c.getName(),
                "slug", c.getSlug(),
                "company_number", c.getCompanyNumber()
        )));
    }
}
