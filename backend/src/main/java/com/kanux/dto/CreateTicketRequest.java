package com.kanux.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CreateTicketRequest {
    private String title;
    private String description;
    private String companyId;
    private String departmentId;
    private String priority;
    private String creatorProfileId;
}
