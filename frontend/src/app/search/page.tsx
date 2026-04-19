"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuscadorMascotas() {
  const [termino, setTermino] = useState("");
  const [mascotas, setMascotas] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [vetId, setVetId] = useState("");
  const router = useRouter();

  // Al cargar la página, verificamos quién inició sesión
  useEffect(() => {
    const idGuardado = localStorage.getItem("vetId");
    if (!idGuardado) {
      // Si alguien intenta entrar aquí sin loguearse, lo regresamos al login
      router.push("/login");
    } else {
      setVetId(idGuardado);
    }
  }, [router]);

  const buscarMascotas = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(true);
    setError("");

    try {
      const respuesta = await fetch(`http://localhost:4000/api/mascotas/buscar?q=${termino}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // AQUÍ ENVIAMOS EL ROL PARA LA SEGURIDAD DE POSTGRESQL
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado y Botón de Salida */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buscador de Pacientes</h1>
            <p className="text-sm text-gray-500">
              Sesión activa ID: <span className="font-mono bg-gray-100 px-1 rounded text-gray-800">{vetId}</span>
            </p>
          </div>
          <div>
            <button 
              onClick={() => router.push("/vacunation")}
              className="text-sm text-green-600 hover:text-green-800 font-medium px-4 py-2 border border-green-200 rounded-md hover:bg-green-50 transition-colors mr-2"
            >
              Ver Vacunación
            </button>
            <button 
              onClick={cerrarSesion}
              className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              Cambiar Rol / Salir
            </button>
          </div>
        </div>

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

        {/* Tabla de Resultados */}
        {mascotas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
    </div>
  );
}