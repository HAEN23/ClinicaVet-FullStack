"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginSimulado() {
  const [veterinarios, setVeterinarios] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  // 1. Obtener los veterinarios desde tu API al cargar la pantalla
  useEffect(() => {
    const fetchVeterinarios = async () => {
      try {
        const respuesta = await fetch("http://localhost:4000/api/veterinarios");
        if (!respuesta.ok) throw new Error("Error al conectar con la API");
        const datos = await respuesta.json();
        setVeterinarios(datos);
      } catch (err) {
        setError("No se pudo cargar la lista de usuarios. Verifica que el backend esté encendido.");
      } finally {
        setCargando(false);
      }
    };

    fetchVeterinarios();
  }, []);

  // 2. Manejar el inicio de sesión
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación estricta: No dejar avanzar si no hay rol seleccionado
    if (!rolSeleccionado) {
      setError("Por favor, selecciona un rol para continuar.");
      return;
    }

    // Limpiamos errores previos
    setError("");

    // Guardamos el ID en localStorage. 
    // Esto es clave: de aquí lo leeremos para mandarlo en el header 'x-vet-id'
    localStorage.setItem("vetId", rolSeleccionado);
    
    // Redirigimos a la pantalla de búsqueda
    router.push("/search"); 
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Clínica Veterinaria
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Simulador de Control de Accesos (RLS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Mensaje de Error Prominente */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                Selecciona tu Rol de Acceso
              </label>
              <div className="mt-1">
                <select
                  id="rol"
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={cargando}
                >
                  <option value="" className="text-gray-900">-- Selecciona un usuario --</option>
                  
                  {/* Roles Administrativos Fijos */}
                  <option value="admin" className="text-gray-900">Administrador del Sistema</option>
                  <option value="recepcion" className="text-gray-900">Recepcionista</option>
                  
                  {/* Veterinarios traídos desde PostgreSQL */}
                  <optgroup label="Veterinarios (RLS Activo)" className="text-gray-900 font-semibold">
                    {veterinarios.map((vet: any) => (
                      <option key={vet.id} value={vet.id} className="text-gray-900 font-normal">
                        {vet.nombre} - {vet.especialidad}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {cargando ? "Conectando al servidor..." : "Entrar al Sistema"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}