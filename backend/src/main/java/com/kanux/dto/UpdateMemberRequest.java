package com.kanux.dto;

public class UpdateMemberRequest {
    private String id;
    private String role;

    public UpdateMemberRequest() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
