import { useRouter } from "next/navigation";

export default function SearchHeader({ vetId, setModalAbierto, cerrarSesion }: any) {
  const router = useRouter();

  return (
    <>
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          {/* Se cambió a text-black para máximo contraste */}
          <h1 className="text-2xl font-bold text-black">Buscador de Pacientes</h1>
          <p className="text-sm text-black mt-1">
            Sesión activa ID: <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-black font-bold">{vetId}</span>
          </p>
        </div>
        <div>
          {vetId.toLowerCase() !== "recepcion" && (
            <button 
              onClick={() => router.push("/vacunation")}
              className="text-sm text-green-700 hover:text-green-900 font-bold px-4 py-2 border border-green-300 rounded-md hover:bg-green-50 transition-colors mr-2"
            >
              Ver Vacunación
            </button>
          )}
          
          {vetId.toLowerCase() !== "admin" && (
            <button 
              onClick={() => setModalAbierto("cita")}
              className="text-sm text-blue-700 hover:text-blue-900 font-bold px-4 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors mr-2"
            >
              📅 Agendar Cita
            </button>
          )}
          
          <button 
            onClick={cerrarSesion}
            className="text-sm text-red-700 hover:text-red-900 font-bold px-4 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            Cambiar Rol / Salir
          </button>
        </div>
      </div>

      {vetId.toLowerCase() === "admin" && (
        <div className="mb-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-indigo-950 mb-4 flex items-center gap-2">
            🛡️ Panel de Control Administrativo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setModalAbierto("usuario")} className="bg-white border border-indigo-300 p-4 rounded-md text-indigo-900 font-bold hover:bg-indigo-100 transition shadow-sm">
              👤 Crear Usuario
            </button>
            <button onClick={() => setModalAbierto("asignar")} className="bg-white border border-indigo-300 p-4 rounded-md text-indigo-900 font-bold hover:bg-indigo-100 transition shadow-sm">
              🔗 Asignar Mascota
            </button>
            <button onClick={() => setModalAbierto("vacunas")} className="bg-white border border-indigo-300 p-4 rounded-md text-indigo-900 font-bold hover:bg-indigo-100 transition shadow-sm">
              💉 Gestionar Vacunas
            </button>
          </div>
        </div>
      )}
    </>
  );
}