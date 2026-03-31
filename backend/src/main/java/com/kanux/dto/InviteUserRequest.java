package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class InviteUserRequest {

    private String email;
    private String role;

    @JsonProperty("company_id")
    private String companyId;

    @JsonProperty("display_name")
    private String displayName;
}
