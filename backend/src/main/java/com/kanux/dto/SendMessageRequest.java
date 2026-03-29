package com.kanux.dto;
import com.fasterxml.jackson.annotation.JsonProperty;

public class SendMessageRequest {
    private String content;
    @JsonProperty("user_profile_id")
    private String userProfileId;

    public SendMessageRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getUserProfileId() { return userProfileId; }
    public void setUserProfileId(String userProfileId) { this.userProfileId = userProfileId; }
}
