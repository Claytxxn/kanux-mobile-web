package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AddMemberRequest {

    @JsonProperty("company_id")
    private String companyId;

    @JsonProperty("user_profile_id")
    private String userProfileId;

    private String role;
}
