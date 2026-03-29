package com.kanux.dto;

public class UpdateTicketRequest {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String departmentId;
    private String assigneeProfileId;

    public UpdateTicketRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public String getAssigneeProfileId() { return assigneeProfileId; }
    public void setAssigneeProfileId(String assigneeProfileId) { this.assigneeProfileId = assigneeProfileId; }
}
