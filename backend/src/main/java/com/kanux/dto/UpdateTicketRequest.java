package com.kanux.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateTicketRequest {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String departmentId;
    private String assigneeProfileId;
}
