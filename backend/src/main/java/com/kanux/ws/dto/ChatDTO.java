package com.kanux.ws.dto;

import java.io.Serializable;

public class ChatDTO implements Serializable {
    private String id;
    private String name;
    private String companyId;
    private String departmentId;
    private boolean isPrivate;

    public ChatDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyId() { return companyId; }
    public void setCompanyId(String companyId) { this.companyId = companyId; }

    public String getDepartmentId() { return departmentId; }
    public void setDepartmentId(String departmentId) { this.departmentId = departmentId; }

    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean isPrivate) { this.isPrivate = isPrivate; }
}