package com.kanux.dto;

public class CreateCompanyRequest {
    private String name;
    private String slug;

    public CreateCompanyRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
}
