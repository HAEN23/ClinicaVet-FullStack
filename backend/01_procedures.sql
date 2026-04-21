-- ==========================================================
-- ARCHIVO: 01_procedures.sql
-- Procedure requerido: sp_agendar_cita [cite: 51]
-- ==========================================================

CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id INT,
    p_veterinario_id INT,
    p_fecha_hora TIMESTAMP,
    p_motivo TEXT,
    INOUT p_cita_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    
    INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, estado)
    VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
    RETURNING id INTO p_cita_id;
    
    COMMIT;
END;
$$;