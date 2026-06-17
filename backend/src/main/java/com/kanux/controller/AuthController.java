package com.kanux.controller;

// Não importar com.kanux.dto.ApiResponse para evitar ambiguidade
import com.kanux.dto.LoginRequest;
import com.kanux.dto.VerifyCompanyRequest;
import com.kanux.entity.Company;
import com.kanux.repository.CompanyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@Tag(name = "Auth", description = "Autenticação e geração de token JWT")
public class AuthController {

    private final CompanyRepository companyRepository;

    public AuthController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Operation(
        summary = "Login",
        description = "Autentica usuário e retorna instrução para uso do token JWT do Supabase.",
        requestBody = @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = LoginRequest.class))
        ),
        responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Login realizado com sucesso. Use o token JWT do Supabase.",
                content = @Content(schema = @Schema(example = "{ 'message': 'Use Supabase auth token in Authorization header' }"))
            )
        }
    )
    @PostMapping("/auth/login")
    public ResponseEntity<com.kanux.dto.ApiResponse<Map<String, String>>> login(@org.springframework.web.bind.annotation.RequestBody LoginRequest req) {
        return ResponseEntity.ok(com.kanux.dto.ApiResponse.ok(Map.of("message", "Use Supabase auth token in Authorization header")));
    }

    @Operation(
        summary = "Verificar empresa",
        description = "Verifica se uma empresa existe pelo slug ou número.",
        requestBody = @RequestBody(
            required = true,
            content = @Content(schema = @Schema(implementation = VerifyCompanyRequest.class))
        ),
        responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Empresa encontrada ou não encontrada.",
                content = @Content(schema = @Schema(example = "{ 'id': '...', 'name': '...', 'slug': '...', 'company_number': 123 }"))
            )
        }
    )
    @PostMapping("/verify-company")
    public ResponseEntity<com.kanux.dto.ApiResponse<Map<String, Object>>> verifyCompany(@org.springframework.web.bind.annotation.RequestBody VerifyCompanyRequest req) {
        if (req.getSlug() == null || req.getSlug().isBlank())
            return ResponseEntity.badRequest().body(com.kanux.dto.ApiResponse.fail("slug is required"));

        Optional<Company> company = companyRepository.findBySlugOrNumber(req.getSlug().trim());
        if (company.isEmpty())
            return ResponseEntity.ok(com.kanux.dto.ApiResponse.fail("Empresa não encontrada"));

        Company c = company.get();
        return ResponseEntity.ok(com.kanux.dto.ApiResponse.ok(Map.of(
                "id", c.getId().toString(),
                "name", c.getName(),
                "slug", c.getSlug(),
                "company_number", c.getCompanyNumber()
        )));
    }
}
