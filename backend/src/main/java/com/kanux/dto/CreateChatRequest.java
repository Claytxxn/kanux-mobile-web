package com.kanux.dto;
import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateChatRequest {
    private String type;
    private String name;
    private String companyId;
    private String departmentId;
    @JsonProperty("is_private")
    private boolean isPrivate;

    public CreateChatRequest() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean isPrivate) { this.isPrivate = isPrivate; }
}
