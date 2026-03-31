package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateProfileRequest {

    @JsonProperty("display_name")
    private String displayName;

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String phone;
    private String position;
    private String department;
}
