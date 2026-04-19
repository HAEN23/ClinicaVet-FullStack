"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VacunacionPendiente() {
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vetId, setVetId] = useState("");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const router = useRouter();

  // 1. Verificar sesión y cargar datos iniciales
  useEffect(() => {
    const idGuardado = localStorage.getItem("vetId");
    if (!idGuardado) {
      router.push("/login");
      return;
    }
    setVetId(idGuardado);
    cargarPendientes(idGuardado);
  }, [router]);

  // 2. Función para traer los datos (Aquí entra Redis en el backend)
  const cargarPendientes = async (idVeterinario: string) => {
    try {
      const respuesta = await fetch("http://localhost:4000/api/vacunacion-pendiente", {
        headers: { "x-vet-id": idVeterinario }
      });
      if (!respuesta.ok) throw new Error("Error al cargar datos");
      const datos = await respuesta.json();
      setPendientes(datos);
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // 3. Función para aplicar vacuna (Invalida el Caché)
  const aplicarVacuna = async (mascotaId: number, vacunaId: number) => {
    setProcesandoId(`${mascotaId}-${vacunaId}`);
    try {
      const respuesta = await fetch("http://localhost:4000/api/vacunas/aplicar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vet-id": vetId
        },
        body: JSON.stringify({
          mascota_id: mascotaId,
          vacuna_id: vacunaId,
          veterinario_id: vetId !== 'admin' && vetId !== 'recepcion' ? vetId : 1, // Fallback si es admin
          costo_cobrado: 350.00 // Costo simulado
        })
      });

      if (!respuesta.ok) throw new Error("Error al registrar vacuna");
      
      // Si se aplicó con éxito, recargamos la lista
      await cargarPendientes(vetId);
    } catch (err) {
      alert("Error al aplicar la vacuna");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Vacunación (Redis Cache)</h1>
            <p className="text-sm text-gray-500">Mascotas que requieren atención inmediata</p>
          </div>
          <button 
            onClick={() => router.push("/search")}
            className="text-sm text-blue-600 font-medium hover:underline"
          >
            ← Volver al buscador
          </button>
        </div>

        {cargando ? (
          <p className="text-center text-gray-600 my-12">Cargando datos desde caché...</p>
        ) : error ? (
          <p className="text-center text-red-600 my-12">{error}</p>
        ) : pendientes.length === 0 ? (
          <div className="bg-green-50 p-8 text-center rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">¡Excelente! No hay mascotas con vacunación pendiente.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mascota</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vacuna Requerida</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendientes.map((fila: any) => {
                  const idUnico = `${fila.mascota_id}-${fila.vacuna_id}`;
                  const estaProcesando = procesandoId === idUnico;
                  
                  return (
                    <tr key={idUnico} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fila.nombre_mascota}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{fila.especie}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{fila.vacuna_pendiente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => aplicarVacuna(fila.mascota_id, fila.vacuna_id)}
                          disabled={estaProcesando}
                          className="bg-green-600 text-white px-4 py-2 rounded shadow-sm hover:bg-green-700 disabled:bg-gray-400 font-medium text-xs transition-colors"
                        >
                          {estaProcesando ? "Registrando..." : "Aplicar Vacuna"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}