import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from 'redis'; // <-- Importamos Redis

const app = express();

// ==========================================
// CONFIGURACIÓN DE POSTGRESQL (PRISMA)
// ==========================================
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:secretpassword@localhost:5433/clinica_vet?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ==========================================
// CONFIGURACIÓN DE REDIS
// ==========================================
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
});

redisClient.on('error', (err) => console.log('Redis Client Error:', err));
redisClient.connect().catch(console.error);

const PORT = process.env.PORT || 4000;

// ==========================================
// ALMACENAMIENTO EN MEMORIA (Para citas)
// ==========================================
let citasEnMemoria: any[] = [];
let siguienteIdCita = 1;

app.use(cors());
app.use(express.json());

// ==========================================
// ENDPOINTS ANTERIORES
// ==========================================
app.get('/api/health', (req, res) => res.json({ status: 'API OK' }));

app.get('/api/veterinarios', async (req, res) => {
  try {
    const veterinarios = await prisma.veterinarios.findMany({ where: { activo: true } });
    res.json(veterinarios);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/api/mascotas/buscar', async (req, res) => {
  try {
    const termino = req.query.q as string || '';
    const vetId = req.headers['x-vet-id'] as string;

    // Ejecutamos todo dentro de una TRANSACCIÓN
    // Esto garantiza que la regla RLS solo aplique a esta consulta exacta
    // y evita la fuga de datos entre conexiones (Pregunta 2 del reporte)
    const mascotas = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // 1. Nos "ponemos el gafete" del rol correcto
      if (vetId === 'admin') {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE rol_admin;`);
      } else if (vetId === 'recepcion') {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE rol_recepcion;`);
      } else if (vetId) {
        // Es un veterinario
        await tx.$executeRawUnsafe(`SET LOCAL ROLE rol_veterinario;`);
        // Le decimos qué veterinario es
        await tx.$executeRaw`SELECT set_config('app.current_vet_id', ${vetId}, true);`;
      }

      // 2. Hacemos la búsqueda. Ahora PostgreSQL SÍ filtrará los datos.
      return await tx.mascotas.findMany({
        where: { nombre: { contains: termino, mode: 'insensitive' } },
        include: { duenos: true }
      });
    });

    res.json(mascotas);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({ error: 'Error' });
  }
});

// ======================================================================
// NUEVO ENDPOINT 3: CONSULTA CACHEADA CON REDIS (Vacunación Pendiente)
// ======================================================================
app.get('/api/vacunacion-pendiente', async (req, res) => {
  const CACHE_KEY = 'vacunacion_pendiente_data';

  try {
    // 1. Intentamos buscar en Redis primero
    const cachedData = await redisClient.get(CACHE_KEY);

    if (cachedData) {
      // CACHE HIT: Lo encontramos en memoria, respondemos rápido
      console.log(`[${new Date().toISOString()}] [CACHE HIT] vacunacion_pendiente (~5-20ms)`);
      return res.json(JSON.parse(cachedData));
    }

    // CACHE MISS: No está en Redis, tenemos que ir a PostgreSQL
    console.log(`[${new Date().toISOString()}] [CACHE MISS] vacunacion_pendiente (~100-300ms)`);
    
    // Al ser una Vista (View) pura de SQL, usamos queryRaw
    const pendientes = await prisma.$queryRaw`SELECT * FROM v_mascotas_vacunacion_pendiente;`;

    // Truco técnico: Convertir BigInts a String (Prisma devuelve los IDs como BigInt a veces)
    const dataToCache = JSON.stringify(pendientes, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );

    // 2. Guardamos en Redis con un TTL (Time To Live) de 300 segundos (5 minutos)
    await redisClient.setEx(CACHE_KEY, 300, dataToCache);

    res.json(pendientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar vacunación' });
  }
});

// ======================================================================
// NUEVO ENDPOINT 4: INVALIDACIÓN DE CACHÉ (Aplicar Vacuna)
// ======================================================================
app.post('/api/vacunas/aplicar', async (req, res) => {
  const { mascota_id, vacuna_id, veterinario_id, costo_cobrado } = req.body;

  try {
    // 1. Registramos la vacuna en la base de datos
    const nuevaVacuna = await prisma.vacunas_aplicadas.create({
      data: {
        mascota_id: Number(mascota_id),
        vacuna_id: Number(vacuna_id),
        veterinario_id: Number(veterinario_id),
        costo_cobrado: Number(costo_cobrado),
        fecha_aplicacion: new Date()
      }
    });

    // 2. INVALIDACIÓN DEL CACHÉ: 
    // Alguien se vacunó, la lista de pendientes ya no es válida. La borramos.
    console.log(`[${new Date().toISOString()}] [INVALIDACIÓN] Nueva vacuna aplicada. Borrando caché...`);
    await redisClient.del('vacunacion_pendiente_data');

    res.json(nuevaVacuna);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aplicar vacuna' });
  }
});

// --- NUEVOS ENDPOINTS PARA EL ADMINISTRADOR ---

// ======================================================================
// ENDPOINTS DE ADMINISTRADOR (Recuperados)
// ======================================================================

// 1. Obtener el inventario actual de vacunas (CONEXIÓN REAL A POSTGRESQL)
app.get('/api/admin/vacunas', async (req, res) => {
  const adminId = req.headers['x-vet-id'];
  if (adminId !== 'admin') return res.status(403).json({ error: "No autorizado" });

  try {
    const inventario = await prisma.inventario_vacunas.findMany();
    res.json(inventario);
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    res.status(500).json({ error: "Error al obtener el inventario" });
  }
});

// 2. Gestionar inventario de vacunas (CONEXIÓN REAL A POSTGRESQL)
app.post('/api/admin/vacunas', async (req, res) => {
  const { nombre, cantidad } = req.body;
  const adminId = req.headers['x-vet-id'];
  
  if (adminId !== 'admin') return res.status(403).json({ error: "No autorizado" });

  try {
    const cantidadNumerica = parseInt(cantidad);

    // 1. Buscamos la vacuna por su nombre exacto
    const vacunaExistente = await prisma.inventario_vacunas.findFirst({
      where: { nombre: nombre }
    });

    if (vacunaExistente) {
      // 2. Si existe, hacemos el UPDATE sumando al 'stock_actual'
      const nuevaVacuna = await prisma.inventario_vacunas.update({
        where: { id: vacunaExistente.id },
        data: { stock_actual: vacunaExistente.stock_actual + cantidadNumerica }
      });
      res.json({ mensaje: `✅ Éxito: Se sumaron ${cantidadNumerica} dosis. El nuevo stock de "${nombre}" es ${nuevaVacuna.stock_actual}.` });
    } else {
      res.status(400).json({ error: "Esa vacuna no existe en el catálogo de la base de datos." });
    }
  } catch (error) {
    console.error("Error en BD:", error);
    res.status(500).json({ error: "Error al actualizar la base de datos" });
  }
});

// 3. Crear nuevo usuario
app.post('/api/admin/usuarios', async (req, res) => {
  const adminId = req.headers['x-vet-id'];
  if (adminId !== 'admin') return res.status(403).json({ error: "No autorizado" });
  res.json({ mensaje: "✅ Usuario simulado creado con éxito." });
});

// 4. Asignar mascota a veterinario
app.post('/api/admin/asignar', async (req, res) => {
  const adminId = req.headers['x-vet-id'];
  if (adminId !== 'admin') return res.status(403).json({ error: "No autorizado" });
  res.json({ mensaje: "✅ Mascota asignada con éxito." });
});

// 5. Agendar cita (RESTRINGIDO A RECEPCIÓN Y VETERINARIOS)
app.post('/api/admin/agendar-cita', async (req, res) => {
  const { mascota_id, fecha } = req.body;
  const userId = req.headers['x-vet-id'];

  // Validación RBAC Estricta: El admin NO puede agendar citas.
  if (userId === 'admin') {
    return res.status(403).json({ error: "Rol no autorizado. Solo Recepción o Veterinarios pueden agendar citas." });
  }

  try {
    // Crear nueva cita en memoria
    const nuevaCita = {
      id: siguienteIdCita++,
      mascota: `Mascota #${mascota_id}`,
      fecha: fecha,
      motivo: "Cita Agendada",
      estado: "Pendiente" // Estado inicial
    };
    
    // Agregar a la lista de citas en memoria
    citasEnMemoria.push(nuevaCita);
    
    res.json({ mensaje: `✅ Cita confirmada para el paciente #${mascota_id} el ${fecha}` });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar en la base de datos" });
  }
});

// 6. Obtener todas las citas (Para Recepción y Admin) - MODIFICADO PARA FILTRAR
app.get('/api/admin/citas', async (req, res) => {
  const userId = req.headers['x-vet-id'];
  
  // Validación de seguridad para Recepción y Admin (El Admin sí puede VER las citas, pero no crearlas)
  if (userId !== 'recepcion' && userId !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado" });
  }

  try {
    // FILTRAR: Solo devolvemos las citas que tengan el estado "Pendiente"
    const citasPendientes = citasEnMemoria.filter((cita) => cita.estado === "Pendiente");

    // Ordenar por fecha y enviarlas
    const citasOrdenadas = citasPendientes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    res.json(citasOrdenadas);
  } catch (error) {
    res.status(500).json({ error: "Error al recuperar la agenda" });
  }
});

// 7. Confirmar llegada de paciente (RESTRINGIDO SOLO A RECEPCIÓN)
app.post('/api/admin/confirmar-llegada', async (req, res) => {
  const { cita_id } = req.body;
  const userId = req.headers['x-vet-id'];

  // Validación RBAC Estricta: SOLO Recepción confirma llegadas.
  if (userId !== 'recepcion') {
    return res.status(403).json({ error: "Operación denegada. Solo el departamento de Recepción puede confirmar llegadas." });
  }

  try {
    // Buscamos la cita específica en nuestra memoria
    const citaIndex = citasEnMemoria.findIndex(c => c.id === cita_id);
    
    if (citaIndex !== -1) {
      // Cambiamos su estado a "Confirmada" para que el GET ya no la envíe
      citasEnMemoria[citaIndex].estado = "Confirmada";
      res.json({ mensaje: "✅ Llegada confirmada en el servidor." });
    } else {
      res.status(404).json({ error: "Cita no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor al confirmar llegada" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor API corriendo en http://localhost:${PORT}`);
});