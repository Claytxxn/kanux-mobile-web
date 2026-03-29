package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.entity.Department;
import com.kanux.entity.UserProfile;
import com.kanux.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getDepartments(
            @AuthenticationPrincipal UserProfile p, @RequestParam(required = false) String companyId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        List<Department> depts = companyId != null
                ? departmentRepository.findByCompanyId(UUID.fromString(companyId))
                : departmentRepository.findAll();
        return ResponseEntity.ok(ApiResponse.ok(depts));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> createDepartment(
            @AuthenticationPrincipal UserProfile p, @RequestBody Map<String, String> body) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        String name = body.get("name"); String companyId = body.get("companyId");
        if (name == null || companyId == null) return ResponseEntity.badRequest().body(ApiResponse.fail("name e companyId são obrigatórios"));
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        Department department = new Department();
        department.setCompanyId(UUID.fromString(companyId));
        department.setName(name);
        department.setSlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(departmentRepository.save(department)));
    }

    @SuppressWarnings("null")
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(
            @AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        departmentRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
