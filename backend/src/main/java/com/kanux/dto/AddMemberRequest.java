package com.kanux.dto;

public class AddMemberRequest {
    private String company_id;
    private String user_profile_id;
    private String role;

    public AddMemberRequest() {}

    public String getCompany_id() { return company_id; }
    public void setCompany_id(String company_id) { this.company_id = company_id; }

    public String getUser_profile_id() { return user_profile_id; }
    public void setUser_profile_id(String user_profile_id) { this.user_profile_id = user_profile_id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
