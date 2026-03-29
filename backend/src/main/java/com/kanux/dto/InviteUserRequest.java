package com.kanux.dto;

public class InviteUserRequest {
    private String email;
    private String company_id;
    private String role;
    private String display_name;

    public InviteUserRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCompany_id() { return company_id; }
    public void setCompany_id(String company_id) { this.company_id = company_id; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDisplay_name() { return display_name; }
    public void setDisplay_name(String display_name) { this.display_name = display_name; }
}
