package com.kanux.dto;

public class CreateTicketRequest {
    private String title;
    private String description;
    private String companyId;
    private String departmentId;
    private String priority;
    private String creatorProfileId;

    public CreateTicketRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getCreatorProfileId() { return creatorProfileId; }
    public void setCreatorProfileId(String creatorProfileId) { this.creatorProfileId = creatorProfileId; }
}
