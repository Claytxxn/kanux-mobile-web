package com.kanux.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateMemberRequest {
    private String id;
    private String role;
}
