package com.kanux.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CreateCompanyRequest {
    private String name;
    private String slug;
}
