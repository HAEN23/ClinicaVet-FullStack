-- ==========================================================
-- ARCHIVO: 02_triggers.sql
-- Trigger requerido: trg_historial_cita 
-- ==========================================================

-- 1. Primero creamos la función que ejecutará el trigger
CREATE OR REPLACE FUNCTION fn_trg_historial_cita()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion, fecha)
    VALUES (
        'NUEVA_CITA',
        NEW.id,
        'Se agendó una cita para la mascota ID ' || NEW.mascota_id || ' con el veterinario ID ' || NEW.veterinario_id,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminamos el trigger si existe para evitar errores al recrearlo
DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

-- 3. Vinculamos el trigger a la tabla citas
CREATE TRIGGER trg_historial_cita
AFTER INSERT ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_trg_historial_cita();