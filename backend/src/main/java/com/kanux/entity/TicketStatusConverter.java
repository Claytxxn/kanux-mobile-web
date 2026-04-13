package com.kanux.entity;

import com.kanux.entity.Ticket.TicketStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = false)
public class TicketStatusConverter implements AttributeConverter<TicketStatus, String> {

    private static final Logger log = LoggerFactory.getLogger(TicketStatusConverter.class);

    @Override
    public String convertToDatabaseColumn(TicketStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public TicketStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return TicketStatus.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown status '{}', defaulting to OPEN", dbData);
            return TicketStatus.OPEN;
        }
    }
}
