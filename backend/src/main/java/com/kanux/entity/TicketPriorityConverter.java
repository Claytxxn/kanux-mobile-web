package com.kanux.entity;

import com.kanux.entity.Ticket.TicketPriority;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = false)
public class TicketPriorityConverter implements AttributeConverter<TicketPriority, String> {

    private static final Logger log = LoggerFactory.getLogger(TicketPriorityConverter.class);

    @Override
    public String convertToDatabaseColumn(TicketPriority attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public TicketPriority convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return null;
        try {
            return TicketPriority.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown priority '{}', defaulting to MEDIUM", dbData);
            return TicketPriority.MEDIUM;
        }
    }
}
