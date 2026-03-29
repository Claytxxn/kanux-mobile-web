#!/bin/bash
# =============================================================
# Kanux - Script de setup
# Execute na RAIZ do projeto (onde estão as pastas backend/ e mobile/)
# =============================================================

set -e
ROOT=$(pwd)
JAVA="$ROOT/backend/src/main/java/com/kanux"
RES="$ROOT/backend/src/main/resources"
MOBILE_SRC="$ROOT/mobile/src"

echo "📁 Criando estrutura de pastas..."
mkdir -p "$JAVA/config"
mkdir -p "$JAVA/controller"
mkdir -p "$JAVA/dto"
mkdir -p "$JAVA/entity"
mkdir -p "$JAVA/repository"
mkdir -p "$JAVA/security"
mkdir -p "$RES/db/migration"

# =============================================================
# pom.xml
# =============================================================
echo "📝 Escrevendo pom.xml..."
cat > "$ROOT/backend/pom.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.5</version>
        <relativePath/>
    </parent>
    <groupId>com.kanux</groupId>
    <artifactId>kanux-backend</artifactId>
    <version>0.0.1</version>
    <name>kanux-backend</name>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
EOF

# =============================================================
# application.yml
# =============================================================
echo "📝 Escrevendo application.yml..."
cat > "$RES/application.yml" << 'EOF'
server:
  port: 8080

spring:
  application:
    name: kanux-backend
  datasource:
    url: jdbc:postgresql://aws-0-us-west-1.pooler.supabase.com:6543/postgres
    username: postgres.jeffersondiogo-12s-project
    password: "H,&yjfy4!Rc#HUy"
    driver-class-name: org.postgresql.Driver
    hikari:
      connection-timeout: 20000
      maximum-pool-size: 5
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: true
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    properties:
      hibernate:
        format_sql: true
        default_schema: public
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

# IMPORTANTE: Substitua pelo JWT Secret do seu projeto Supabase
# Onde encontrar: Supabase Dashboard -> Settings -> API -> JWT Settings -> JWT Secret
supabase:
  jwt-secret: your-supabase-jwt-secret-here

logging:
  level:
    com.kanux: DEBUG
    org.springframework.security: INFO
    org.hibernate.SQL: DEBUG
EOF

# =============================================================
# Main Application
# =============================================================
echo "📝 Escrevendo KanuxBackendApplication.java..."
cat > "$JAVA/KanuxBackendApplication.java" << 'EOF'
package com.kanux;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KanuxBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(KanuxBackendApplication.class, args);
    }
}
EOF

# Remove arquivo antigo se existir
rm -f "$JAVA/KanuxApplication.java"

# =============================================================
# Config
# =============================================================
echo "📝 Escrevendo config/SecurityConfig.java..."
cat > "$JAVA/config/SecurityConfig.java" << 'EOF'
package com.kanux.config;

import com.kanux.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/verify-company").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
EOF

echo "📝 Escrevendo config/CorsConfig.java..."
cat > "$JAVA/config/CorsConfig.java" << 'EOF'
package com.kanux.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
EOF

# =============================================================
# Security
# =============================================================
echo "📝 Escrevendo security/JwtService.java..."
cat > "$JAVA/security/JwtService.java" << 'EOF'
package com.kanux.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.UUID;

@Service
@Slf4j
public class JwtService {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public boolean isValid(String token) {
        try { parseClaims(token); return true; }
        catch (Exception e) { log.debug("JWT inválido: {}", e.getMessage()); return false; }
    }

    private Claims parseClaims(String token) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
EOF

echo "📝 Escrevendo security/JwtAuthFilter.java..."
cat > "$JAVA/security/JwtAuthFilter.java" << 'EOF'
package com.kanux.security;

import com.kanux.repository.UserProfileRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserProfileRepository userProfileRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);
        try {
            if (jwtService.isValid(token)) {
                UUID authUserId = jwtService.extractUserId(token);
                userProfileRepository.findByAuthUserId(authUserId).ifPresent(profile -> {
                    var auth = new UsernamePasswordAuthenticationToken(
                            profile, null,
                            profile.isSuperAdmin()
                                    ? List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"), new SimpleGrantedAuthority("ROLE_USER"))
                                    : List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        } catch (Exception e) {
            log.debug("Erro ao autenticar JWT: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}
EOF

# =============================================================
# Entities
# =============================================================
echo "📝 Escrevendo entities..."

cat > "$JAVA/entity/UserProfile.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "auth_user_id", nullable = false, unique = true)
    private UUID authUserId;
    @Column(name = "display_name")
    private String displayName;
    private String email;
    @Column(name = "avatar_url")
    private String avatarUrl;
    private String phone;
    private String position;
    private String department;
    @Column(name = "is_super_admin", nullable = false)
    private boolean isSuperAdmin = false;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
EOF

cat > "$JAVA/entity/Company.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {
    @Id @GeneratedValue
    private UUID id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false, unique = true)
    private String slug;
    @Column(name = "company_number", insertable = false, updatable = false)
    private Integer companyNumber;
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
EOF

cat > "$JAVA/entity/CompanyMember.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "company_members")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyMember {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberRole role = MemberRole.MEMBER;
    @Column(name = "joined_at", updatable = false)
    private Instant joinedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;
    @PrePersist
    protected void onCreate() { if (joinedAt == null) joinedAt = Instant.now(); }
    public enum MemberRole { MEMBER, MANAGER, ADMIN }
}
EOF

cat > "$JAVA/entity/Department.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Department {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String slug;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
EOF

cat > "$JAVA/entity/Chat.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Chat {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(nullable = false)
    private String name;
    @Column(name = "is_private", nullable = false)
    private boolean isPrivate = false;
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
EOF

cat > "$JAVA/entity/Message.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "chat_id", nullable = false)
    private UUID chatId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String attachments = "[]";
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
EOF

cat > "$JAVA/entity/Ticket.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {
    @Id @GeneratedValue
    private UUID id;
    @Column(insertable = false, updatable = false)
    private String number;
    @Column(name = "company_id", nullable = false)
    private UUID companyId;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(name = "creator_profile_id", nullable = false)
    private UUID creatorProfileId;
    @Column(name = "assignee_profile_id")
    private UUID assigneeProfileId;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.OPEN;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priority = TicketPriority.MEDIUM;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Column(name = "resolved_at")
    private Instant resolvedAt;
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }
    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
    public enum TicketStatus { OPEN, PENDING, RESOLVED, CLOSED }
    public enum TicketPriority { LOW, MEDIUM, HIGH }
}
EOF

cat > "$JAVA/entity/TicketComment.java" << 'EOF'
package com.kanux.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_comments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketComment {
    @Id @GeneratedValue
    private UUID id;
    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;
    @Column(name = "user_profile_id", nullable = false)
    private UUID userProfileId;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_profile_id", insertable = false, updatable = false)
    private UserProfile userProfile;
    @PrePersist
    protected void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
EOF

# =============================================================
# Repositories
# =============================================================
echo "📝 Escrevendo repositories..."

cat > "$JAVA/repository/UserProfileRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByAuthUserId(UUID authUserId);
    Optional<UserProfile> findByEmail(String email);
}
EOF

cat > "$JAVA/repository/CompanyRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    Optional<Company> findBySlug(String slug);

    @Query("SELECT c FROM Company c WHERE CAST(c.companyNumber AS string) = :num OR c.slug = :num")
    Optional<Company> findBySlugOrNumber(@Param("num") String num);

    @Query("SELECT c FROM Company c JOIN CompanyMember m ON m.companyId = c.id WHERE m.userProfileId = :profileId ORDER BY c.createdAt DESC")
    List<Company> findByMemberProfileId(@Param("profileId") UUID profileId);
}
EOF

cat > "$JAVA/repository/CompanyMemberRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.CompanyMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyMemberRepository extends JpaRepository<CompanyMember, UUID> {
    List<CompanyMember> findByCompanyId(UUID companyId);
    Optional<CompanyMember> findByCompanyIdAndUserProfileId(UUID companyId, UUID userProfileId);
    boolean existsByCompanyIdAndUserProfileId(UUID companyId, UUID userProfileId);

    @Query("SELECT m FROM CompanyMember m JOIN FETCH m.userProfile WHERE m.companyId = :companyId")
    List<CompanyMember> findByCompanyIdWithProfile(@Param("companyId") UUID companyId);
}
EOF

cat > "$JAVA/repository/DepartmentRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByCompanyId(UUID companyId);
}
EOF

cat > "$JAVA/repository/ChatRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, UUID> {
    List<Chat> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
EOF

cat > "$JAVA/repository/MessageRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("SELECT m FROM Message m WHERE m.chatId = :chatId ORDER BY m.createdAt ASC")
    List<Message> findByChatIdOrderByCreatedAt(@Param("chatId") UUID chatId);
}
EOF

cat > "$JAVA/repository/TicketRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
EOF

cat > "$JAVA/repository/TicketCommentRepository.java" << 'EOF'
package com.kanux.repository;

import com.kanux.entity.TicketComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TicketCommentRepository extends JpaRepository<TicketComment, UUID> {
    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
EOF

# =============================================================
# DTOs
# =============================================================
echo "📝 Escrevendo DTOs..."

cat > "$JAVA/dto/ApiResponse.java" << 'EOF'
package com.kanux.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String error;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }
    public static <T> ApiResponse<T> fail(String error) {
        return ApiResponse.<T>builder().success(false).error(error).build();
    }
}
EOF

cat > "$JAVA/dto/LoginRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class LoginRequest { private String email; private String password; }
EOF

cat > "$JAVA/dto/VerifyCompanyRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class VerifyCompanyRequest { private String slug; }
EOF

cat > "$JAVA/dto/CreateCompanyRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class CreateCompanyRequest { private String name; private String slug; }
EOF

cat > "$JAVA/dto/UpdateProfileRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class UpdateProfileRequest {
    private String display_name;
    private String avatar_url;
    private String phone;
    private String position;
    private String department;
}
EOF

cat > "$JAVA/dto/CreateTicketRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class CreateTicketRequest {
    private String title;
    private String description;
    private String companyId;
    private String departmentId;
    private String priority;
    private String creatorProfileId;
}
EOF

cat > "$JAVA/dto/UpdateTicketRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class UpdateTicketRequest {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String departmentId;
    private String assigneeProfileId;
}
EOF

cat > "$JAVA/dto/CreateChatRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class CreateChatRequest {
    private String type;
    private String name;
    private String companyId;
    private String departmentId;
    private boolean is_private;
}
EOF

cat > "$JAVA/dto/SendMessageRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class SendMessageRequest { private String content; private String user_profile_id; }
EOF

cat > "$JAVA/dto/AddMemberRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class AddMemberRequest { private String company_id; private String user_profile_id; private String role; }
EOF

cat > "$JAVA/dto/UpdateMemberRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class UpdateMemberRequest { private String id; private String role; }
EOF

cat > "$JAVA/dto/InviteUserRequest.java" << 'EOF'
package com.kanux.dto;
import lombok.Data;
@Data
public class InviteUserRequest { private String email; private String company_id; private String role; private String display_name; }
EOF

# =============================================================
# Controllers
# =============================================================
echo "📝 Escrevendo controllers..."

cat > "$JAVA/controller/AuthController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.LoginRequest;
import com.kanux.dto.VerifyCompanyRequest;
import com.kanux.entity.Company;
import com.kanux.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final CompanyRepository companyRepository;

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
            return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                    .success(false).error("Empresa não encontrada").build());

        Company c = company.get();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id", c.getId().toString(),
                "name", c.getName(),
                "slug", c.getSlug(),
                "company_number", c.getCompanyNumber()
        )));
    }
}
EOF

cat > "$JAVA/controller/ProfileController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.UpdateProfileRequest;
import com.kanux.entity.UserProfile;
import com.kanux.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserProfileRepository userProfileRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(@AuthenticationPrincipal UserProfile p) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        return ResponseEntity.ok(ApiResponse.ok(p));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @AuthenticationPrincipal UserProfile p, @RequestBody UpdateProfileRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (req.getDisplay_name() != null) p.setDisplayName(req.getDisplay_name());
        if (req.getAvatar_url()   != null) p.setAvatarUrl(req.getAvatar_url());
        if (req.getPhone()        != null) p.setPhone(req.getPhone());
        if (req.getPosition()     != null) p.setPosition(req.getPosition());
        if (req.getDepartment()   != null) p.setDepartment(req.getDepartment());
        return ResponseEntity.ok(ApiResponse.ok(userProfileRepository.save(p)));
    }
}
EOF

cat > "$JAVA/controller/CompanyController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.CreateCompanyRequest;
import com.kanux.entity.Company;
import com.kanux.entity.CompanyMember;
import com.kanux.entity.UserProfile;
import com.kanux.repository.CompanyMemberRepository;
import com.kanux.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository memberRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Company>>> getUserCompanies(@AuthenticationPrincipal UserProfile p) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        return ResponseEntity.ok(ApiResponse.ok(companyRepository.findByMemberProfileId(p.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Company>> createCompany(
            @AuthenticationPrincipal UserProfile p, @RequestBody CreateCompanyRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        Company company = companyRepository.save(Company.builder()
                .name(req.getName()).slug(req.getSlug().toLowerCase().trim()).createdBy(p.getId()).build());
        memberRepository.save(CompanyMember.builder()
                .companyId(company.getId()).userProfileId(p.getId()).role(CompanyMember.MemberRole.ADMIN).build());
        return ResponseEntity.ok(ApiResponse.ok(company));
    }
}
EOF

cat > "$JAVA/controller/AdminController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.*;
import com.kanux.entity.*;
import com.kanux.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository memberRepository;
    private final UserProfileRepository userProfileRepository;

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<List<Company>>> getAllCompanies(@AuthenticationPrincipal UserProfile p) {
        if (!isSuperAdmin(p)) return forbidden();
        return ResponseEntity.ok(ApiResponse.ok(
                companyRepository.findAll().stream()
                        .sorted(Comparator.comparing(Company::getCreatedAt).reversed())
                        .collect(Collectors.toList())));
    }

    @DeleteMapping("/company")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (!isSuperAdmin(p)) return forbidden();
        companyRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/members")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMembers(
            @AuthenticationPrincipal UserProfile p, @RequestParam(required = false) String companyId) {
        if (!isSuperAdmin(p)) return forbidden();
        List<CompanyMember> members = companyId != null
                ? memberRepository.findByCompanyIdWithProfile(UUID.fromString(companyId))
                : memberRepository.findAll();
        List<Map<String, Object>> result = members.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId()); map.put("company_id", m.getCompanyId());
            map.put("user_profile_id", m.getUserProfileId()); map.put("role", m.getRole());
            map.put("joined_at", m.getJoinedAt());
            if (m.getUserProfile() != null) {
                UserProfile up = m.getUserProfile();
                map.put("user_profiles", Map.of(
                        "id", up.getId(), "display_name", String.valueOf(up.getDisplayName()),
                        "email", String.valueOf(up.getEmail()), "avatar_url", String.valueOf(up.getAvatarUrl())));
            }
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/members")
    public ResponseEntity<ApiResponse<CompanyMember>> addMember(
            @AuthenticationPrincipal UserProfile p, @RequestBody AddMemberRequest req) {
        if (!isSuperAdmin(p)) return forbidden();
        UUID companyId = UUID.fromString(req.getCompany_id());
        UUID upId = UUID.fromString(req.getUser_profile_id());
        if (memberRepository.existsByCompanyIdAndUserProfileId(companyId, upId))
            return ResponseEntity.badRequest().body(ApiResponse.fail("Membro já existe"));
        CompanyMember m = memberRepository.save(CompanyMember.builder().companyId(companyId).userProfileId(upId)
                .role(CompanyMember.MemberRole.valueOf(req.getRole() != null ? req.getRole() : "MEMBER")).build());
        return ResponseEntity.ok(ApiResponse.ok(m));
    }

    @PutMapping("/members")
    public ResponseEntity<ApiResponse<CompanyMember>> updateMember(
            @AuthenticationPrincipal UserProfile p, @RequestBody UpdateMemberRequest req) {
        if (!isSuperAdmin(p)) return forbidden();
        return memberRepository.findById(UUID.fromString(req.getId())).map(m -> {
            m.setRole(CompanyMember.MemberRole.valueOf(req.getRole()));
            return ResponseEntity.ok(ApiResponse.ok(memberRepository.save(m)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/members")
    public ResponseEntity<ApiResponse<Void>> removeMember(@AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (!isSuperAdmin(p)) return forbidden();
        memberRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/invite-user")
    public ResponseEntity<ApiResponse<Map<String, Object>>> inviteUser(
            @AuthenticationPrincipal UserProfile p, @RequestBody InviteUserRequest req) {
        if (!isSuperAdmin(p)) return forbidden();
        UserProfile invited = userProfileRepository.findByEmail(req.getEmail()).orElseGet(() ->
                userProfileRepository.save(UserProfile.builder()
                        .authUserId(UUID.randomUUID()).email(req.getEmail()).displayName(req.getDisplay_name()).build()));
        UUID companyId = UUID.fromString(req.getCompany_id());
        if (!memberRepository.existsByCompanyIdAndUserProfileId(companyId, invited.getId()))
            memberRepository.save(CompanyMember.builder().companyId(companyId).userProfileId(invited.getId())
                    .role(CompanyMember.MemberRole.valueOf(req.getRole() != null ? req.getRole() : "MEMBER")).build());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "message", "Usuário convidado com sucesso",
                "profile_id", invited.getId().toString(), "email", invited.getEmail())));
    }

    private boolean isSuperAdmin(UserProfile p) { return p != null && p.isSuperAdmin(); }

    @SuppressWarnings("unchecked")
    private <T> ResponseEntity<ApiResponse<T>> forbidden() {
        return ResponseEntity.status(403).body(ApiResponse.fail("Acesso negado: Super Admin necessário"));
    }
}
EOF

cat > "$JAVA/controller/TicketController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.CreateTicketRequest;
import com.kanux.dto.UpdateTicketRequest;
import com.kanux.entity.Ticket;
import com.kanux.entity.TicketComment;
import com.kanux.entity.UserProfile;
import com.kanux.repository.TicketCommentRepository;
import com.kanux.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getTickets(
            @AuthenticationPrincipal UserProfile p,
            @RequestParam(required = false) String companyId,
            @RequestParam(required = false) String ticketId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (ticketId != null)
            return ticketRepository.findById(UUID.fromString(ticketId))
                    .map(t -> ResponseEntity.ok((ApiResponse<?>) ApiResponse.ok(t)))
                    .orElse(ResponseEntity.notFound().build());
        if (companyId != null)
            return ResponseEntity.ok(ApiResponse.ok(
                    ticketRepository.findByCompanyIdOrderByCreatedAtDesc(UUID.fromString(companyId))));
        return ResponseEntity.badRequest().body(ApiResponse.fail("companyId ou ticketId é obrigatório"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Ticket>> createTicket(
            @AuthenticationPrincipal UserProfile p, @RequestBody CreateTicketRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        UUID creatorId = req.getCreatorProfileId() != null ? UUID.fromString(req.getCreatorProfileId()) : p.getId();
        Ticket ticket = ticketRepository.save(Ticket.builder()
                .companyId(UUID.fromString(req.getCompanyId()))
                .departmentId(req.getDepartmentId() != null ? UUID.fromString(req.getDepartmentId()) : null)
                .creatorProfileId(creatorId).title(req.getTitle()).description(req.getDescription())
                .priority(req.getPriority() != null ? Ticket.TicketPriority.valueOf(req.getPriority()) : Ticket.TicketPriority.MEDIUM)
                .status(Ticket.TicketStatus.OPEN).build());
        return ResponseEntity.ok(ApiResponse.ok(ticket));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Ticket>> updateTicket(
            @AuthenticationPrincipal UserProfile p, @RequestBody UpdateTicketRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        return ticketRepository.findById(UUID.fromString(req.getId())).map(t -> {
            if (req.getTitle()       != null) t.setTitle(req.getTitle());
            if (req.getDescription() != null) t.setDescription(req.getDescription());
            if (req.getPriority()    != null) t.setPriority(Ticket.TicketPriority.valueOf(req.getPriority()));
            if (req.getDepartmentId()      != null) t.setDepartmentId(UUID.fromString(req.getDepartmentId()));
            if (req.getAssigneeProfileId() != null) t.setAssigneeProfileId(UUID.fromString(req.getAssigneeProfileId()));
            if (req.getStatus() != null) {
                Ticket.TicketStatus s = Ticket.TicketStatus.valueOf(req.getStatus());
                t.setStatus(s);
                if (s == Ticket.TicketStatus.RESOLVED && t.getResolvedAt() == null) t.setResolvedAt(Instant.now());
            }
            return ResponseEntity.ok(ApiResponse.ok(ticketRepository.save(t)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteTicket(
            @AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        ticketRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<ApiResponse<List<TicketComment>>> getComments(
            @AuthenticationPrincipal UserProfile p, @PathVariable String ticketId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        return ResponseEntity.ok(ApiResponse.ok(commentRepository.findByTicketIdOrderByCreatedAtAsc(UUID.fromString(ticketId))));
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<ApiResponse<TicketComment>> addComment(
            @AuthenticationPrincipal UserProfile p, @PathVariable String ticketId,
            @RequestBody Map<String, String> body) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        String content = body.get("content");
        if (content == null || content.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.fail("content é obrigatório"));
        return ResponseEntity.ok(ApiResponse.ok(commentRepository.save(TicketComment.builder()
                .ticketId(UUID.fromString(ticketId)).userProfileId(p.getId()).content(content).build())));
    }
}
EOF

cat > "$JAVA/controller/ChatController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.dto.CreateChatRequest;
import com.kanux.dto.SendMessageRequest;
import com.kanux.entity.Chat;
import com.kanux.entity.Message;
import com.kanux.entity.UserProfile;
import com.kanux.repository.ChatRepository;
import com.kanux.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getChats(
            @AuthenticationPrincipal UserProfile p,
            @RequestParam(required = false) String companyId,
            @RequestParam(required = false) String chatId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (chatId != null)
            return chatRepository.findById(UUID.fromString(chatId))
                    .map(c -> ResponseEntity.ok((ApiResponse<?>) ApiResponse.ok(c)))
                    .orElse(ResponseEntity.notFound().build());
        if (companyId != null)
            return ResponseEntity.ok(ApiResponse.ok(
                    chatRepository.findByCompanyIdOrderByCreatedAtDesc(UUID.fromString(companyId))));
        return ResponseEntity.badRequest().body(ApiResponse.fail("companyId ou chatId é obrigatório"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Chat>> createChat(
            @AuthenticationPrincipal UserProfile p, @RequestBody CreateChatRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        Chat chat = chatRepository.save(Chat.builder()
                .companyId(UUID.fromString(req.getCompanyId()))
                .departmentId(req.getDepartmentId() != null ? UUID.fromString(req.getDepartmentId()) : null)
                .name(req.getName()).isPrivate(req.is_private()).createdBy(p.getId()).build());
        return ResponseEntity.ok(ApiResponse.ok(chat));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteChat(
            @AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        chatRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMessages(
            @AuthenticationPrincipal UserProfile p, @PathVariable String chatId) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        List<Map<String, Object>> result = messageRepository
                .findByChatIdOrderByCreatedAt(UUID.fromString(chatId))
                .stream().limit(50).map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{chatId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @AuthenticationPrincipal UserProfile p, @PathVariable String chatId,
            @RequestBody SendMessageRequest req) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        if (req.getContent() == null || req.getContent().isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.fail("content é obrigatório"));
        UUID senderId = p.getId();
        if (req.getUser_profile_id() != null) {
            try { senderId = UUID.fromString(req.getUser_profile_id()); } catch (Exception ignored) {}
        }
        Message saved = messageRepository.save(Message.builder()
                .chatId(UUID.fromString(chatId)).userProfileId(senderId)
                .content(req.getContent()).attachments("[]").build());
        return ResponseEntity.ok(ApiResponse.ok(toMap(saved)));
    }

    private Map<String, Object> toMap(Message m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId()); map.put("chat_id", m.getChatId());
        map.put("user_profile_id", m.getUserProfileId()); map.put("content", m.getContent());
        map.put("attachments", m.getAttachments()); map.put("created_at", m.getCreatedAt());
        map.put("updated_at", m.getUpdatedAt());
        return map;
    }
}
EOF

cat > "$JAVA/controller/DepartmentController.java" << 'EOF'
package com.kanux.controller;

import com.kanux.dto.ApiResponse;
import com.kanux.entity.Department;
import com.kanux.entity.UserProfile;
import com.kanux.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

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
        return ResponseEntity.ok(ApiResponse.ok(departmentRepository.save(
                Department.builder().companyId(UUID.fromString(companyId)).name(name).slug(slug).build())));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(
            @AuthenticationPrincipal UserProfile p, @RequestParam String id) {
        if (p == null) return ResponseEntity.status(401).body(ApiResponse.fail("Unauthorized"));
        departmentRepository.deleteById(UUID.fromString(id));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
EOF

# =============================================================
# SQL Migrations
# =============================================================
echo "📝 Escrevendo migrations SQL..."

cat > "$RES/db/migration/V1__initial_schema.sql" << 'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS companies_company_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS tickets_number_seq START 1;

CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id    UUID NOT NULL UNIQUE,
    display_name    TEXT,
    email           TEXT,
    avatar_url      TEXT,
    phone           TEXT,
    position        TEXT,
    department      TEXT,
    is_super_admin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    company_number  INTEGER NOT NULL DEFAULT nextval('companies_company_number_seq'),
    created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER','MANAGER','ADMIN')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS chats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    is_private      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    attachments     JSONB NOT NULL DEFAULT '[]',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              TEXT NOT NULL UNIQUE DEFAULT 'T-' || LPAD(nextval('tickets_number_seq')::TEXT, 5, '0'),
    company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    creator_profile_id  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    assignee_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    status              TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','PENDING','RESOLVED','CLOSED')),
    priority            TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id      ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_profile_id ON company_members(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id                ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at             ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_company_id              ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status                  ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at              ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id       ON ticket_comments(ticket_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EOF

cat > "$RES/db/migration/V2__seed_super_admin.sql" << 'EOF'
-- Seed: cria super admin inicial.
-- IMPORTANTE: troque o auth_user_id pelo UUID real do seu usuário no Supabase
-- Supabase Dashboard -> Authentication -> Users -> copie o UUID do usuário admin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE email = 'admin@kanux.com') THEN
        INSERT INTO user_profiles (auth_user_id, display_name, email, is_super_admin)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'Super Admin', 'admin@kanux.com', TRUE);
    END IF;
END $$;
EOF

# =============================================================
# Frontend fixes
# =============================================================
echo "📝 Escrevendo arquivos corrigidos do mobile..."

# Garante que as pastas existem
mkdir -p "$MOBILE_SRC/contexts"
mkdir -p "$MOBILE_SRC/lib"
mkdir -p "$ROOT/mobile/app/(auth)"

cat > "$MOBILE_SRC/lib/api.ts" << 'EOF'
// API configuration — Java Spring Boot backend

const POSSIBLE_URLS = [
  'http://localhost:8080',
  'http://10.0.2.2:8080',
  'http://127.0.0.1:8080',
];

let cachedApiUrl: string | null = null;
let detectionPromise: Promise<string> | null = null;

const detectApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  for (const url of POSSIBLE_URLS) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/api/verify-company`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: 'test' }), signal: controller.signal,
      });
      clearTimeout(t);
      const text = await res.text();
      if (text.includes('success') || text.includes('error') || text.includes('company')) {
        cachedApiUrl = url; return url;
      }
    } catch { continue; }
  }
  cachedApiUrl = 'http://localhost:8080';
  return cachedApiUrl;
};

const getApiUrl = (): string => {
  if (cachedApiUrl) return cachedApiUrl;
  if (!detectionPromise) detectionPromise = detectApiUrl();
  return 'http://localhost:8080';
};

export const initApi = async (): Promise<string> => {
  try {
    const Constants = require('expo-constants');
    const configUrl = Constants?.default?.expoConfig?.extra?.apiUrl;
    if (configUrl) { cachedApiUrl = configUrl; return configUrl; }
    if (Constants?.default?.expoConfig?.extra?.isProduction) {
      cachedApiUrl = 'https://your-backend-production.com'; return cachedApiUrl;
    }
  } catch {}
  return detectApiUrl();
};

export const getApiUrlSync = (): string => getApiUrl();

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => { authToken = token; };
export const getAuthToken = (): string | null => authToken;

const getHeaders = (requiresAuth = true): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (requiresAuth && authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
};

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}, requiresAuth = true): Promise<T> {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options, headers: { ...getHeaders(requiresAuth), ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || `Erro ${response.status}`);
  return data;
}

export const api = {
  get baseUrl() { return getApiUrl(); },
  async login(email: string, password: string) {
    const result: any = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    if (result.success && result.data?.token) setAuthToken(result.data.token);
    return result;
  },
  async getProfile() { return apiRequest('/api/profile'); },
  async updateProfile(data: { display_name?: string; avatar_url?: string; phone?: string; position?: string; department?: string }) {
    return apiRequest('/api/profile', { method: 'PATCH', body: JSON.stringify(data) });
  },
  async getCompanies() { return apiRequest('/api/companies'); },
  async getAllCompanies() { return apiRequest('/api/admin/companies'); },
  async createCompany(name: string, slug: string) {
    return apiRequest('/api/companies', { method: 'POST', body: JSON.stringify({ name, slug }) });
  },
  async deleteCompany(id: string) { return apiRequest(`/api/admin/company?id=${id}`, { method: 'DELETE' }); },
  async getMembers(companyId?: string) {
    return apiRequest(`/api/admin/members${companyId ? `?companyId=${companyId}` : ''}`);
  },
  async addMember(companyId: string, userProfileId: string, role = 'MEMBER') {
    return apiRequest('/api/admin/members', { method: 'POST', body: JSON.stringify({ company_id: companyId, user_profile_id: userProfileId, role }) });
  },
  async updateMember(id: string, role: string) {
    return apiRequest('/api/admin/members', { method: 'PUT', body: JSON.stringify({ id, role }) });
  },
  async removeMember(id: string) { return apiRequest(`/api/admin/members?id=${id}`, { method: 'DELETE' }); },
  async getTickets(companyId?: string, ticketId?: string) {
    const p = new URLSearchParams();
    if (companyId) p.append('companyId', companyId);
    if (ticketId)  p.append('ticketId', ticketId);
    return apiRequest(`/api/tickets${p.toString() ? `?${p}` : ''}`);
  },
  async createTicket(data: { title: string; description?: string; companyId: string; departmentId?: string; priority?: string; creatorProfileId?: string }) {
    return apiRequest('/api/tickets', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateTicket(data: { id: string; title?: string; description?: string; priority?: string; status?: string; departmentId?: string; assigneeProfileId?: string }) {
    return apiRequest('/api/tickets', { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteTicket(id: string) { return apiRequest(`/api/tickets?id=${id}`, { method: 'DELETE' }); },
  async getChats(companyId?: string, chatId?: string) {
    const p = new URLSearchParams();
    if (companyId) p.append('companyId', companyId);
    if (chatId)    p.append('chatId', chatId);
    return apiRequest(`/api/chats${p.toString() ? `?${p}` : ''}`);
  },
  async getMessages(chatId: string) { return apiRequest(`/api/chats/${chatId}/messages`); },
  async createChat(name: string, companyId: string, departmentId?: string, isPrivate = false) {
    return apiRequest('/api/chats', { method: 'POST', body: JSON.stringify({ type: 'chat', name, companyId, departmentId, is_private: isPrivate }) });
  },
  async sendMessage(chatId: string, content: string, userProfileId: string) {
    return apiRequest(`/api/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ content, user_profile_id: userProfileId }) });
  },
  async deleteChat(id: string) { return apiRequest(`/api/chats?id=${id}`, { method: 'DELETE' }); },
  async getDepartments(companyId?: string) {
    return apiRequest(`/api/departments${companyId ? `?companyId=${companyId}` : ''}`);
  },
  async verifyCompany(slug: string) {
    return apiRequest('/api/verify-company', { method: 'POST', body: JSON.stringify({ slug }) }, false);
  },
  async inviteUser(email: string, companyId: string, role = 'MEMBER', displayName?: string) {
    return apiRequest('/api/admin/invite-user', { method: 'POST', body: JSON.stringify({ email, company_id: companyId, role, display_name: displayName }) });
  },
  logout() { setAuthToken(null); },
};
EOF

cat > "$MOBILE_SRC/contexts/AuthContext.tsx" << 'EOF'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// @ts-ignore
import NetInfo from '@react-native-community/netinfo';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getUserProfile, Profile } from '../lib/supabase';
import { saveUserCompany } from '../lib/offlineStorage';
import { setAuthToken } from '../lib/api';

interface AuthContextType {
  session: Session | null; user: User | null; profile: Profile | null;
  loading: boolean; isOnline: boolean;
  refreshProfile: () => Promise<void>; signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return; }
    const profileData = await getUserProfile(user.id);
    setProfile(profileData);
    if (profileData) {
      const { data: memberData } = await supabase
        .from('company_members').select('company_id')
        .eq('user_profile_id', profileData.id).limit(1).single();
      if (memberData?.company_id) await saveUserCompany(memberData.company_id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
    setSession(null); setUser(null); setProfile(null);
  };

  useEffect(() => {
    const unsubNet = NetInfo.addEventListener((state: any) => setIsOnline(state.isConnected ?? false));

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null);
      if (session?.access_token) setAuthToken(session.access_token);
      if (session?.user) {
        getUserProfile(session.user.id).then((profileData) => {
          setProfile(profileData);
          if (profileData) {
            supabase.from('company_members').select('company_id')
              .eq('user_profile_id', profileData.id).limit(1).single()
              .then(({ data }) => { if (data?.company_id) saveUserCompany(data.company_id); });
          }
          setLoading(false);
        });
      } else { setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setUser(session?.user ?? null);
      setAuthToken(session?.access_token ?? null);
      if (session?.user) getUserProfile(session.user.id).then(setProfile);
      else setProfile(null);
    });

    return () => { subscription.unsubscribe(); unsubNet(); };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, isOnline, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
EOF

cat > "$ROOT/mobile/app/(auth)/login.tsx" << 'EOF'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { api, initApi, setAuthToken } from '../../src/lib/api';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading]         = useState(false);
  const [isSignUp, setIsSignUp]       = useState(false);
  const router = useRouter();

  useEffect(() => { initApi().catch(() => {}); }, []);

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Erro', 'Preencha todos os campos'); return; }
    if (!isSignUp && !companySlug) { Alert.alert('Erro', 'Informe o número da empresa'); return; }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada! Verifique seu email.');
      } else {
        const result = await api.verifyCompany(companySlug.trim());
        if (!result.success) { Alert.alert('Erro', result.error || 'Empresa não encontrada'); return; }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session?.access_token) setAuthToken(data.session.access_token);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao autenticar');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}><Text style={styles.logo}>K</Text></View>
          <Text style={styles.title}>Kanux</Text>
          <Text style={styles.subtitle}>{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.textMuted}
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          {!isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número da Empresa</Text>
              <TextInput style={styles.input} placeholder="1000" placeholderTextColor={colors.textMuted}
                value={companySlug} onChangeText={setCompanySlug} keyboardType="numeric" />
            </View>
          )}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={colors.text} />
              : <Text style={styles.buttonText}>{isSignUp ? 'Criar Conta' : 'Entrar'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.linkText}>
              {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© 2024 Kanux</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  scrollContent:  { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header:         { alignItems: 'center', marginBottom: spacing.xxl },
  logoContainer:  { width: 80, height: 80, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.brand },
  logo:           { fontSize: 40, fontWeight: 'bold', color: colors.text },
  title:          { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  subtitle:       { fontSize: 16, color: colors.textSecondary },
  form:           { width: '100%' },
  inputContainer: { marginBottom: spacing.md },
  inputLabel:     { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs },
  input:          { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  button:         { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md, ...shadows.brand },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: colors.text, fontSize: 18, fontWeight: '600' },
  linkButton:     { marginTop: spacing.lg, alignItems: 'center', padding: spacing.sm },
  linkText:       { color: colors.primary, fontSize: 15, fontWeight: '500' },
  footer:         { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.xxl },
});
EOF

echo ""
echo "=============================================="
echo "✅ Setup completo!"
echo "=============================================="
echo ""
echo "⚠️  PRÓXIMO PASSO OBRIGATÓRIO:"
echo "   Abra: backend/src/main/resources/application.yml"
echo "   Substitua 'your-supabase-jwt-secret-here' pelo"
echo "   JWT Secret do seu projeto Supabase."
echo "   (Supabase Dashboard → Settings → API → JWT Secret)"
echo ""
echo "▶️  Para rodar o backend:"
echo "   cd backend && mvn spring-boot:run"
echo ""
