"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Importamos nuestros nuevos componentes limpios
import SearchHeader from "@/components/SearchHeader";
import Appointments from "@/components/Appointments";
import ActionModal from "@/components/ActionModal";

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
  const [misPacientes, setMisPacientes] = useState<any[]>([]);
  
  const router = useRouter();

  // EFECTOS DE CARGA DE DATOS 
  useEffect(() => {
    const idGuardado = localStorage.getItem("vetId");
    if (!idGuardado) router.push("/login");
    else setVetId(idGuardado);
  }, [router]);

  useEffect(() => {
    if (vetId && vetId.toLowerCase() === "admin") {
      const obtenerStock = async () => {
        try {
          const res = await fetch("http://localhost:4000/api/admin/vacunas", { headers: { "x-vet-id": "admin" } });
          if (res.ok) setInventario(await res.json());
        } catch (err) { console.error(err); }
      };
      obtenerStock();
    }
  }, [vetId]);

  useEffect(() => {
    if (vetId === "recepcion" || vetId === "admin") cargarCitas();
  }, [vetId]);

  useEffect(() => {
    if (vetId && vetId !== "admin" && vetId !== "recepcion") {
      const cargarMisPacientes = async () => {
        try {
          const res = await fetch(`http://localhost:4000/api/mascotas/buscar?q=`, { headers: { "x-vet-id": vetId } });
          if (res.ok) setMisPacientes(await res.json());
        } catch (err) { console.error(err); }
      };
      cargarMisPacientes();
    }
  }, [vetId]);

  // FUNCIONES LÓGICAS
  const buscarMascotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setError("");
    try {
      const respuesta = await fetch(`http://localhost:4000/api/mascotas/buscar?q=${termino}`, {
        method: "GET", headers: { "Content-Type": "application/json", "x-vet-id": vetId }
      });
      if (!respuesta.ok) throw new Error("Error en la búsqueda");
      const datos = await respuesta.json();
      setMascotas(datos);
      if(datos.length === 0) setError("No se encontraron mascotas.");
    } catch (err) {
      setError("Error de conexión.");
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
      const res = await fetch("http://localhost:4000/api/admin/citas", { headers: { "x-vet-id": vetId } });
      setCitas(await res.json());
    } catch (err) { console.error(err); }
  };

  const ejecutarAccionAdmin = async (ruta: string, cuerpo: object) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/${ruta}`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-vet-id": vetId },
        body: JSON.stringify(cuerpo)
      });
      if (!res.ok) throw new Error("Error en el servidor");
      const data = await res.json();
      alert(data.mensaje);
      setModalAbierto(null);
      if (ruta === "agendar-cita") cargarCitas();
    } catch (err) {
      alert("No se pudo completar la acción.");
    }
  };

  const confirmarLlegada = async (citaId: number) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/confirmar-llegada`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-vet-id": vetId },
        body: JSON.stringify({ cita_id: citaId })
      });
      if (res.ok) {
        setCitas(prevCitas => prevCitas.filter(cita => cita.id !== citaId));
        alert("✅ Paciente ingresado.");
      }
    } catch (err) { alert("Error de conexión."); }
  };

  // RENDERIZADO DEL CONTENEDOR
  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black"> {/* Aseguramos color de texto global base */}
      <div className="max-w-4xl mx-auto">
        
        {/* Componente Extraído 1: Encabezado */}
        <SearchHeader vetId={vetId} setModalAbierto={setModalAbierto} cerrarSesion={cerrarSesion} />

        {/* Buscador y Tabla de Resultados */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <form onSubmit={buscarMascotas} className="flex gap-4">
            {/* AQUÍ SE AGREGÓ text-black para evitar el gris pálido en la barra de búsqueda */}
            <input 
              type="text" 
              value={termino} 
              onChange={(e) => setTermino(e.target.value)} 
              placeholder="Escribe el nombre de la mascota..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder-gray-500" 
            />
            <button type="submit" disabled={buscando} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400">
              {buscando ? "Buscando..." : "Buscar Mascota"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
        </div>

        {mascotas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Especie</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Dueño</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mascotas.map((mascota: any) => (
                  <tr key={mascota.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{mascota.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{mascota.especie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{mascota.duenos ? mascota.duenos.nombre : "Sin dueño"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Componente Extraído 2: Lista de Citas */}
        <Appointments vetId={vetId} citas={citas} confirmarLlegada={confirmarLlegada} />
      </div>

      {/* Componente Extraído 3: Modal Global */}
      <ActionModal 
        modalAbierto={modalAbierto} 
        setModalAbierto={setModalAbierto} 
        formData={formData} 
        setFormData={setFormData} 
        ejecutarAccionAdmin={ejecutarAccionAdmin} 
        vetId={vetId} 
        misPacientes={misPacientes} 
      />
    </div>
  );
}