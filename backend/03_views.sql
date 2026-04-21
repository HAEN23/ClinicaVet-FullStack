-- ==========================================================
-- ARCHIVO: 03_views.sql
-- Function: fn_total_facturado 
-- Vista: v_mascotas_vacunacion_pendiente 
-- ==========================================================


CREATE OR REPLACE FUNCTION fn_total_facturado(p_mascota_id INT, p_anio INT)
RETURNS NUMERIC AS $$
DECLARE
    v_total_citas NUMERIC;
    v_total_vacunas NUMERIC;
BEGIN
    
    SELECT COALESCE(SUM(costo), 0) INTO v_total_citas
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND estado = 'COMPLETADA'
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    
    SELECT COALESCE(SUM(costo_cobrado), 0) INTO v_total_vacunas
    FROM vacunas_aplicadas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_aplicacion) = p_anio;

    RETURN v_total_citas + v_total_vacunas;
END;
$$ LANGUAGE plpgsql;


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