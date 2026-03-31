package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class SendMessageRequest {
    private String content;

    @JsonProperty("user_profile_id")
    private String userProfileId;
}
