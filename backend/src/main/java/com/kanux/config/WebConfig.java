package com.kanux.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableAsync
public class WebConfig implements WebMvcConfigurer {

    private final ActivityLogInterceptor activityLogInterceptor;

    public WebConfig(ActivityLogInterceptor activityLogInterceptor) {
        this.activityLogInterceptor = activityLogInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(activityLogInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/health/**", "/api/debug/**", "/api/verify-company",
                        "/api/auth/**", "/actuator/**");
    }
}
