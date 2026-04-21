-- Habilitar Row-Level Security en las 3 tablas obligatorias [cite: 61]
ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. POLÍTICAS PARA LA TABLA 'mascotas' 
-- ==========================================

-- Admin y Recepción ven todas las mascotas
CREATE POLICY mascotas_ver_todo ON mascotas
    FOR SELECT USING (current_role IN ('rol_admin', 'rol_recepcion'));

-- Los veterinarios solo ven las mascotas que aparecen asignadas a ellos en vet_atiende_mascota[cite: 62].
CREATE POLICY mascotas_vet_solo_suyas ON mascotas
    FOR SELECT TO rol_veterinario
    USING (
        id IN (
            SELECT mascota_id
            FROM vet_atiende_mascota
            WHERE vet_id = current_setting('app.current_vet_id', true)::INT
        )
    );

-- ==========================================
-- 2. POLÍTICAS PARA LA TABLA 'vacunas_aplicadas' 
-- ==========================================

-- Admin ve todo[cite: 64]. (Recepción ya está bloqueada por el REVOKE) 
CREATE POLICY vacunas_ver_todo ON vacunas_aplicadas
    FOR SELECT USING (current_role = 'rol_admin');

-- Veterinarios solo ven las vacunas de las mascotas que ellos atienden[cite: 63].
CREATE POLICY vacunas_vet_solo_suyas ON vacunas_aplicadas
    FOR SELECT TO rol_veterinario
    USING (
        mascota_id IN (
            SELECT mascota_id
            FROM vet_atiende_mascota
            WHERE vet_id = current_setting('app.current_vet_id', true)::INT
        )
    );

-- ==========================================
-- 3. POLÍTICAS PARA LA TABLA 'citas' 
-- ==========================================

-- Admin y Recepción ven todas las citas.
CREATE POLICY citas_ver_todo ON citas
    FOR SELECT USING (current_role IN ('rol_admin', 'rol_recepcion'));

-- Veterinarios solo ven las citas donde ellos son el veterinario asignado[cite: 65].
CREATE POLICY citas_vet_solo_suyas ON citas
    FOR SELECT TO rol_veterinario
    USING (
        veterinario_id = current_setting('app.current_vet_id', true)::INT
    );