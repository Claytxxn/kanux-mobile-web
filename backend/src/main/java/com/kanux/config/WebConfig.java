package com.kanux.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Objects;

@Configuration
@EnableAsync
public class WebConfig implements WebMvcConfigurer {

    @NonNull
    private final ActivityLogInterceptor activityLogInterceptor;

    public WebConfig(@NonNull ActivityLogInterceptor activityLogInterceptor) {
        this.activityLogInterceptor = Objects.requireNonNull(activityLogInterceptor);
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(activityLogInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/health/**", "/api/debug/**", "/api/verify-company",
                        "/api/auth/**", "/actuator/**");
    }
}
