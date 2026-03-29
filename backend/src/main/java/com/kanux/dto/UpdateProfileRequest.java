package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateProfileRequest {
    @JsonProperty("display_name")
    private String displayName;
    @JsonProperty("avatar_url")
    private String avatarUrl;
    private String phone;
    private String position;
    private String department;

    public UpdateProfileRequest() {}

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
