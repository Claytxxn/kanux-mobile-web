package com.kanux.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CreateChatRequest {
    private String type;
    private String name;
    private String companyId;
    private String departmentId;

    // Campo booleano com nome snake_case no JSON
    @JsonProperty("is_private")
    private boolean isPrivate;
}
