# Clínica Veterinaria Segura - Full-Stack (PostgreSQL + Redis)
**Autor:** Heber Alexander Escobar Nuricumbo
**Matrícula:** 243691
**Materia:** Base de Datos Avanzadas (Corte 3)

## Descripción del Proyecto
Sistema de gestión veterinaria desarrollado con una arquitectura de **Defensa en Profundidad (Defense in Depth)**. Demuestra la implementación de seguridad a nivel de base de datos usando PostgreSQL (RLS, Roles, Triggers) y optimización de lectura de vistas materializadas mediante caché en memoria con Redis. El frontend y backend operan bajo el principio de menor privilegio, delegando la autorización al motor de base de datos.

---

## Respuestas a la Evaluación (Corte 3)

### 1. ¿Qué política RLS aplicaste a la tabla mascotas?
**Cláusula exacta (tomada de `05_rls.sql`):**
```sql
CREATE POLICY policy_vet_ver_sus_mascotas ON mascotas
FOR SELECT TO rol_veterinario
USING (
    id IN (SELECT mascota_id FROM vet_atiende_mascota WHERE vet_id = current_setting('app.current_vet_id')::integer)
)

Lo que hace es interceptar cualquier SELECT a la tabla mascotas que provenga del rol de veterinario. En lugar de devolver toda la tabla, PostgreSQL lee la variable de sesión app.current_vet_id (que el backend inyectó al autenticar) y filtra las filas, devolviendo únicamente aquellas mascotas cuyo id exista en la tabla intermedia vet_atiende_mascota

---
### 2. Cualquiera que sea la estrategia que elegiste para identificar al veterinario actual en RLS, tiene un vector de ataque posible. ¿Cuál es? ¿Tu sistema lo previene? ¿Cómo?

**El Peligro :**  
En el sistema, si el Veterinario 1 termina su consulta y no limpia bien su rastro, la siguiente consulta (del Veterinario 2) podría mostrar datos que no le corresponden. A esto le llamamos **Fuga de Datos**.

**¿Lo prevenimos?**  
**Sí, completamente.**  
El sistema obliga a que cada consulta del veterinario ocurra dentro de una **habitación privada de un solo uso**. En el mundo de las computadoras, esto se llama "Transacción". Cuando el veterinario termina, esa habitación se destruye automáticamente y el teléfono vuelve a la centralita **completamente limpio y vacío**. Así el siguiente veterinario empieza de cero.

---

### 3. Si usas SECURITY DEFINER en algún procedure, ¿qué medida específica tomaste para prevenir la escalada de privilegios que ese modo habilita?

**El Problema:**  
A veces el sistema necesita usar una **Llave Maestra** para hacer tareas importantes (como actualizar historiales médicos automáticamente). El riesgo es que un atacante podría engañar al procedure para que ejecute código malicioso usando los permisos de administrador del creador de la función

**La Solución:**  
Le pusimos un **candado a la llave maestra**. Al final de la declaración del procedure o trigger, se añade de forma explícita `SET search_path = public`. Esto bloquea los ataques de inyección de rutas de búsqueda,

Esto impide que alguien esconda instrucciones maliciosas en otros rincones del sistema para que la llave maestra las ejecute sin querer.

---

### 4. ¿Qué TTL le pusiste al caché Redis y por qué ese valor específico? ¿Qué pasaría si fuera demasiado bajo? ¿Demasiado alto?
**Valor asignado:** Le asigné un TTL de **300 segundos** (5 minutos) a la vista de `vacunacion_pendiente_data`.

**Justificación:** - **Si fuera demasiado bajo (ej. 5 segundos o sin caché):** Se anularía el propósito del caché. En horas pico, si múltiples recepcionistas consultan a los pacientes en espera simultáneamente, el backend forzaría a PostgreSQL a recalcular constantemente la vista (que incluye múltiples JOINs y agregaciones), sobrecargando el CPU de la base de datos.

- **Si fuera demasiado alto (ej. 24 horas):** Sufriríamos de *Stale Data* (Datos obsoletos). Un perro podría recibir su vacuna a las 10:00 AM, pero seguiría apareciendo en la lista de "Pendientes" todo el resto del día. Esto causaría fricción operativa (como intentar vacunar a un paciente dos veces). *Nota: Para mitigar esto por completo, mi sistema también incluye invalidación activa (eliminando la llave de Redis en el endpoint de inserción de vacunas).*

---

### 5. Tu frontend manda input del usuario al backend. Elige un endpoint crítico y pega la línea exacta donde el backend maneja ese input antes de enviarlo a la base de datos. Explica qué protege esa línea y de qué.

**Endpoint:** `POST /api/vacunas/aplicar`
**Archivo:** `api/index.ts` (Aprox. Línea 145)
**Líneas exactas:**
```typescript
mascota_id: Number(mascota_id),
vacuna_id: Number(vacuna_id),

