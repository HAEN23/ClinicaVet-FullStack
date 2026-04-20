"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuscadorMascotas() {
  const [termino, setTermino] = useState("");
  const [mascotas, setMascotas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [vetId, setVetId] = useState("");
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: "", cedula: "", vetIdAsignar: "", mascotaIdAsignar: "", nombreVacuna: "", cantidadVacuna: "", mascotaIdCita: "", fechaCita: "" });
  const [inventario, setInventario] = useState([]);
  const [citas, setCitas] = useState<any[]>([]);
  
  // NUEVOS ESTADOS PARA LA MEJORA DE CITAS DEL VETERINARIO
  const [misPacientes, setMisPacientes] = useState<any[]>([]);
  const [modoCitaVet, setModoCitaVet] = useState<"mis_pacientes" | "nuevo">("mis_pacientes");
  
  const router = useRouter();

  // Al cargar la página, verificamos quién inició sesión
  useEffect(() => {
    const idGuardado = localStorage.getItem("vetId");
    if (!idGuardado) {
      router.push("/login");
    } else {
      setVetId(idGuardado);
    }
  }, [router]);

  // Cargar el inventario automáticamente cuando el Admin entra
  useEffect(() => {
    if (vetId && vetId.toLowerCase() === "admin") {
      const obtenerStock = async () => {
        try {
          const res = await fetch("http://localhost:4000/api/admin/vacunas", {
            method: "GET",
            headers: { "x-vet-id": "admin" }
          });

          if (!res.ok) {
            throw new Error(`El backend no encontró la ruta. Código: ${res.status}`);
          }

          const data = await res.json();
          setInventario(data);
          
        } catch (err) {
          console.error("Motivo real del error:", err);
        }
      };
      obtenerStock();
    }
  }, [vetId]);

  // Cargar citas cuando el usuario es recepción o admin
  useEffect(() => {
    if (vetId === "recepcion" || vetId === "admin") {
      cargarCitas();
    }
  }, [vetId]);

  // NUEVO: Cargar automáticamente "Mis Pacientes" si el rol es Veterinario
  useEffect(() => {
    if (vetId && vetId !== "admin" && vetId !== "recepcion") {
      const cargarMisPacientes = async () => {
        try {
          // Al enviar una búsqueda vacía, el RLS de Postgres nos devolverá SOLO lo que este veterinario atiende
          const res = await fetch(`http://localhost:4000/api/mascotas/buscar?q=`, {
            headers: { "x-vet-id": vetId }
          });
          if (res.ok) {
            const datos = await res.json();
            setMisPacientes(datos);
          }
        } catch (err) {
          console.error("Error al cargar lista de pacientes", err);
        }
      };
      cargarMisPacientes();
    }
  }, [vetId]);

  const buscarMascotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setError("");

    try {
      const respuesta = await fetch(`http://localhost:4000/api/mascotas/buscar?q=${termino}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-vet-id": vetId 
        }
      });

      if (!respuesta.ok) throw new Error("Error en la búsqueda");
      
      const datos = await respuesta.json();
      setMascotas(datos);
      
      if(datos.length === 0) {
          setError("No se encontraron mascotas con ese nombre.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setBuscando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("vetId");
    router.push("/login");
  };

  const cargarCitas = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/admin/citas", {
        headers: { "x-vet-id": vetId }
      });
      const datos = await res.json();
      setCitas(datos);
    } catch (err) {
      console.error("Error al cargar citas");
    }
  };

  const ejecutarAccionAdmin = async (ruta: string, cuerpo: object) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/${ruta}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-vet-id": vetId 
        },
        body: JSON.stringify(cuerpo)
      });

      if (!res.ok) throw new Error("Error en el servidor");

      const data = await res.json();
      alert(data.mensaje);
      setModalAbierto(null);
      
      if (ruta === "agendar-cita") {
        cargarCitas();
      }
    } catch (err) {
      alert("No se pudo agendar la cita. Revisa la conexión.");
    }
  };

  const confirmarLlegada = async (citaId: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/confirmar-llegada`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "x-vet-id": vetId 
        },
        body: JSON.stringify({ cita_id: citaId })
      });

      if (res.ok) {
        setCitas(prevCitas => prevCitas.filter(cita => cita.id !== citaId));
        alert("✅ El paciente ha ingresado a la clínica.");
      } else {
        alert("Error al procesar la llegada en el servidor.");
      }
    } catch (err) {
      alert("Error de conexión al confirmar llegada.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado y Botones Principales */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buscador de Pacientes</h1>
            <p className="text-sm text-gray-500">
              Sesión activa ID: <span className="font-mono bg-gray-100 px-1 rounded text-gray-800">{vetId}</span>
            </p>
          </div>
          <div>
            {vetId.toLowerCase() !== "recepcion" && (
              <button 
                onClick={() => router.push("/vacunation")}
                className="text-sm text-green-600 hover:text-green-800 font-medium px-4 py-2 border border-green-200 rounded-md hover:bg-green-50 transition-colors mr-2"
              >
                Ver Vacunación
              </button>
            )}
            
            {vetId.toLowerCase() !== "admin" && (
              <button 
                onClick={() => setModalAbierto("cita")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors mr-2"
              >
                📅 Agendar Cita
              </button>
            )}
            
            <button 
              onClick={cerrarSesion}
              className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              Cambiar Rol / Salir
            </button>
          </div>
        </div>

        {/* --- PANEL EXCLUSIVO PARA ADMINISTRADORES --- */}
        {vetId.toLowerCase() === "admin" && (
          <div className="mb-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              🛡️ Panel de Control Administrativo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setModalAbierto("usuario")} className="bg-white border border-indigo-200 p-4 rounded-md text-indigo-800 font-semibold hover:bg-indigo-100 transition shadow-sm">
                👤 Crear Usuario
              </button>
              <button onClick={() => setModalAbierto("asignar")} className="bg-white border border-indigo-200 p-4 rounded-md text-indigo-800 font-semibold hover:bg-indigo-100 transition shadow-sm">
                🔗 Asignar Mascota
              </button>
              <button onClick={() => setModalAbierto("vacunas")} className="bg-white border border-indigo-200 p-4 rounded-md text-indigo-800 font-semibold hover:bg-indigo-100 transition shadow-sm">
                💉 Gestionar Vacunas
              </button>
            </div>
          </div>
        )}

        {/* Formulario de Búsqueda */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <form onSubmit={buscarMascotas} className="flex gap-4">
            <input
              type="text"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder="Escribe el nombre de la mascota. Ej. Firulais"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 outline-none"
            />
            <button
              type="submit"
              disabled={buscando}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {buscando ? "Buscando..." : "Buscar Mascota"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
        </div>

        {/* --- SECCIÓN DE PRÓXIMAS CITAS (Recepción y Admin) --- */}
        {(vetId === "recepcion" || vetId === "admin") && (
          <div className="mt-10 bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              📅 Próximas Citas
            </h2>
            <div className="grid gap-4">
              {citas.map((cita) => (
                <div key={cita.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded shadow-sm text-center w-20">
                      <p className="text-xs font-bold text-blue-600">HORA</p>
                      <p className="text-lg font-black text-gray-900">{cita.fecha ? cita.fecha.split('T')[1] : "10:00"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Paciente: {cita.mascota}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{cita.motivo}</p>
                    </div>
                  </div>
                  
                  {vetId.toLowerCase() === "recepcion" && (
                    <button 
                      onClick={() => confirmarLlegada(cita.id)}
                      className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                    >
                      Confirmar Llegada
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de Resultados */}
        {mascotas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dueño</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mascotas.map((mascota: any) => (
                  <tr key={mascota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mascota.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mascota.especie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mascota.duenos ? mascota.duenos.nombre : "Sin dueño registrado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 🚀 MODAL GLOBAL */}
      {/* ========================================================= */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 relative">
            
            <button 
              onClick={() => setModalAbierto(null)}
              className="absolute top-6 left-6 text-gray-900 hover:text-blue-600 flex items-center gap-2 font-medium transition-colors"
            >
              <span className="text-xl">←</span> Cancelar
            </button>

            <div className="mt-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
                {modalAbierto === "usuario" && "👤 Registro de Nuevo Veterinario"}
                {modalAbierto === "asignar" && "🔗 Asignación de Pacientes"}
                {modalAbierto === "vacunas" && "💉 Gestión de Inventario"}
                {modalAbierto === "cita" && "📅 Agendar Nueva Cita"}
              </h3>
              
              <div className="space-y-5">
                
                {modalAbierto === "usuario" && (
                  <>
                    {/* ... Formulario Usuario ... */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">Nombre del Veterinario</label>
                      <input type="text" placeholder="Ej. Juan Pérez" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">Cédula Profesional</label>
                      <input type="text" placeholder="Número de cédula" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setFormData({...formData, cedula: e.target.value})} />
                    </div>
                    <button onClick={() => ejecutarAccionAdmin("usuarios", { nombre: formData.nombre, cedula: formData.cedula })} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">Guardar Registro</button>
                  </>
                )}

                {modalAbierto === "asignar" && (
                  <>
                    {/* ... Formulario Asignar ... */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">ID del Veterinario</label>
                      <input type="number" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50" onChange={(e) => setFormData({...formData, vetIdAsignar: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">ID de la Mascota</label>
                      <input type="number" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50" onChange={(e) => setFormData({...formData, mascotaIdAsignar: e.target.value})} />
                    </div>
                    <button onClick={() => ejecutarAccionAdmin("asignar", { vet_id: formData.vetIdAsignar, mascota_id: formData.mascotaIdAsignar })} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg">Confirmar Asignación</button>
                  </>
                )}

                {modalAbierto === "vacunas" && (
                  <>
                    {/* ... Formulario Vacunas ... */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">Nombre de la Vacuna</label>
                      <select 
                        className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                        onChange={(e) => setFormData({...formData, nombreVacuna: e.target.value})}
                        defaultValue=""
                      >
                        <option value="" disabled>-- Selecciona una vacuna oficial --</option>
                        <option value="Antirrábica canina">Antirrábica canina</option>
                        <option value="Quíntuple felina">Quíntuple felina</option>
                        <option value="Parvovirus canino">Parvovirus canino</option>
                        <option value="Triple felina">Triple felina</option>
                        <option value="Bordetella canina">Bordetella canina</option>
                        <option value="Leucemia felina">Leucemia felina</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-1">Cantidad a Ingresar al Stock</label>
                      <input 
                        type="number" 
                        placeholder="Ej. 50" 
                        className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        onChange={(e) => setFormData({...formData, cantidadVacuna: e.target.value})} 
                      />
                    </div>
                    <button 
                      onClick={() => ejecutarAccionAdmin("vacunas", { nombre: formData.nombreVacuna, cantidad: parseInt(formData.cantidadVacuna) })} 
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg transition-colors"
                    >
                      Actualizar Inventario
                    </button>
                  </>
                )}

                {/* --- NUEVO FORMULARIO INTELIGENTE DE CITAS --- */}
                {modalAbierto === "cita" && (
                  <>
                    {vetId === "recepcion" || vetId === "admin" ? (
                      // 1. VISTA DE RECEPCIÓN: Ingreso de ID Manual (Porque ellos agendan para todos)
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">ID de la Mascota</label>
                        <input type="number" placeholder="Ej. 5" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" 
                          onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})} />
                      </div>
                    ) : (
                      // 2. VISTA DE VETERINARIO: Selector inteligente y Pestaña de Nuevos
                      <>
                        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-lg">
                          <button 
                            onClick={() => setModoCitaVet("mis_pacientes")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoCitaVet === 'mis_pacientes' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            🐾 Mis Pacientes
                          </button>
                          <button 
                            onClick={() => setModoCitaVet("nuevo")}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoCitaVet === 'nuevo' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            ➕ Nuevo Paciente
                          </button>
                        </div>

                        {modoCitaVet === "mis_pacientes" ? (
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">Selecciona de tu Lista</label>
                            <select 
                              className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})}
                              defaultValue=""
                            >
                              <option value="" disabled>-- Elige un paciente --</option>
                              {misPacientes.length === 0 && <option value="" disabled>Aún no tienes pacientes asignados</option>}
                              {misPacientes.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nombre} (Especie: {p.especie})</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">ID del Nuevo Paciente</label>
                            <input type="number" placeholder="Ej. 8" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" 
                              onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})} />
                            <p className="text-xs text-gray-500 mt-2">Ingresa el ID del paciente que aún no forma parte de tu cartera de clientes.</p>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mt-4 mb-1">Fecha y Hora</label>
                      <input type="datetime-local" className="w-full p-3 border rounded-lg text-gray-900 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" 
                        onChange={(e) => setFormData({...formData, fechaCita: e.target.value})} />
                    </div>
                    
                    <button 
                      onClick={() => ejecutarAccionAdmin("agendar-cita", { mascota_id: formData.mascotaIdCita, fecha: formData.fechaCita })} 
                      className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg"
                    >
                      Confirmar Cita
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}