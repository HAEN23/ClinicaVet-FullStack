-- ==========================================================
-- ARCHIVO: 03_views.sql
-- Function: fn_total_facturado 
-- Vista: v_mascotas_vacunacion_pendiente 
-- ==========================================================

-- 1. Función para calcular el total facturado (Citas completadas + Vacunas)
CREATE OR REPLACE FUNCTION fn_total_facturado(p_mascota_id INT, p_anio INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_citas NUMERIC;
    v_total_vacunas NUMERIC;
BEGIN
    -- Sumar el costo de las citas marcadas como COMPLETADAS en ese año
    SELECT COALESCE(SUM(costo), 0) INTO v_total_citas
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND estado = 'COMPLETADA'
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    -- Sumar el costo cobrado de las vacunas aplicadas en ese año
    SELECT COALESCE(SUM(costo_cobrado), 0) INTO v_total_vacunas
    FROM vacunas_aplicadas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_aplicacion) = p_anio;

    RETURN v_total_citas + v_total_vacunas;
END;
$$ LANGUAGE plpgsql;

-- 2. Vista de vacunación pendiente
-- Esta es la consulta más pesada del sistema y la que deberás cachear con Redis[cite: 85].
CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente AS
SELECT 
    m.id AS mascota_id,
    m.nombre AS nombre_mascota,
    m.especie,
    iv.id AS vacuna_id,
    iv.nombre AS vacuna_pendiente
FROM mascotas m
CROSS JOIN inventario_vacunas iv
WHERE NOT EXISTS (
    SELECT 1 
    FROM vacunas_aplicadas va 
    WHERE va.mascota_id = m.id 
      AND va.vacuna_id = iv.id
);