-- Limpieza inicial por si necesitas re-ejecutar el script
DROP ROLE IF EXISTS rol_veterinario;
DROP ROLE IF EXISTS rol_recepcion;
DROP ROLE IF EXISTS rol_admin;

-- Creación de roles base [cite: 56]
CREATE ROLE rol_veterinario;
CREATE ROLE rol_recepcion;
CREATE ROLE rol_admin;

-- ==========================================
-- PERMISOS: ROL ADMINISTRADOR
-- ==========================================
-- Ve todo y gestiona todo (inventario, usuarios, asignaciones)[cite: 41].
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;

-- ==========================================
-- PERMISOS: ROL RECEPCIÓN
-- ==========================================
-- Ve todas las mascotas, dueños y puede agendar citas[cite: 41].
GRANT SELECT ON duenos, mascotas, citas, veterinarios TO rol_recepcion;
GRANT INSERT, UPDATE ON citas TO rol_recepcion;
GRANT USAGE, SELECT ON SEQUENCE citas_id_seq TO rol_recepcion;

-- Restricción estricta: NO puede ver vacunas aplicadas[cite: 41, 63].
REVOKE ALL ON vacunas_aplicadas FROM rol_recepcion;

-- ==========================================
-- PERMISOS: ROL VETERINARIO
-- ==========================================
-- Permisos base (el filtrado fino se hará con RLS en el siguiente script).
-- Puede registrar citas y aplicar vacunas[cite: 41].
GRANT SELECT ON mascotas, duenos, citas, vacunas_aplicadas, inventario_vacunas, vet_atiende_mascota TO rol_veterinario;
GRANT INSERT, UPDATE ON citas, vacunas_aplicadas TO rol_veterinario;
GRANT USAGE, SELECT ON SEQUENCE citas_id_seq, vacunas_aplicadas_id_seq TO rol_veterinario;