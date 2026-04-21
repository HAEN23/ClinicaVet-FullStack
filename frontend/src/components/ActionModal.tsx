import { useState } from "react";

export default function ActionModal({ 
  modalAbierto, setModalAbierto, formData, setFormData, 
  ejecutarAccionAdmin, vetId, misPacientes 
}: any) {
  const [modoCitaVet, setModoCitaVet] = useState<"mis_pacientes" | "nuevo">("mis_pacientes");

  if (!modalAbierto) return null;

  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 relative">
        <button 
          onClick={() => setModalAbierto(null)}
          className="absolute top-6 left-6 text-black hover:text-blue-700 flex items-center gap-2 font-bold transition-colors"
        >
          <span className="text-xl">←</span> Cancelar
        </button>

        <div className="mt-10">
          <h3 className="text-2xl font-bold text-black mb-6 border-b pb-4">
            {modalAbierto === "usuario" && "👤 Registro de Nuevo Veterinario"}
            {modalAbierto === "asignar" && "🔗 Asignación de Pacientes"}
            {modalAbierto === "vacunas" && "💉 Gestión de Inventario"}
            {modalAbierto === "cita" && "📅 Agendar Nueva Cita"}
          </h3>
          
          <div className="space-y-5">
            {modalAbierto === "usuario" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Nombre del Veterinario</label>
                  <input type="text" placeholder="Ej. Juan Pérez" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500" onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Cédula Profesional</label>
                  <input type="text" placeholder="Número de cédula" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-500" onChange={(e) => setFormData({...formData, cedula: e.target.value})} />
                </div>
                <button onClick={() => ejecutarAccionAdmin("usuarios", { nombre: formData.nombre, cedula: formData.cedula })} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">Guardar Registro</button>
              </>
            )}

            {modalAbierto === "asignar" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">ID del Veterinario</label>
                  <input type="number" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setFormData({...formData, vetIdAsignar: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">ID de la Mascota</label>
                  <input type="number" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setFormData({...formData, mascotaIdAsignar: e.target.value})} />
                </div>
                <button onClick={() => ejecutarAccionAdmin("asignar", { vet_id: formData.vetIdAsignar, mascota_id: formData.mascotaIdAsignar })} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg">Confirmar Asignación</button>
              </>
            )}

            {modalAbierto === "vacunas" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Nombre de la Vacuna</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setFormData({...formData, nombreVacuna: e.target.value})}
                    defaultValue=""
                  >
                    <option value="" disabled className="text-gray-500">-- Selecciona una vacuna oficial --</option>
                    <option value="Antirrábica canina" className="text-black">Antirrábica canina</option>
                    <option value="Quíntuple felina" className="text-black">Quíntuple felina</option>
                    <option value="Parvovirus canino" className="text-black">Parvovirus canino</option>
                    <option value="Triple felina" className="text-black">Triple felina</option>
                    <option value="Bordetella canina" className="text-black">Bordetella canina</option>
                    <option value="Leucemia felina" className="text-black">Leucemia felina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Cantidad a Ingresar al Stock</label>
                  <input type="number" placeholder="Ej. 50" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-gray-500" onChange={(e) => setFormData({...formData, cantidadVacuna: e.target.value})} />
                </div>
                <button onClick={() => ejecutarAccionAdmin("vacunas", { nombre: formData.nombreVacuna, cantidad: parseInt(formData.cantidadVacuna) })} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg transition-colors">Actualizar Inventario</button>
              </>
            )}

            {modalAbierto === "cita" && (
              <>
                {vetId === "recepcion" || vetId === "admin" ? (
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">ID de la Mascota</label>
                    <input type="number" placeholder="Ej. 5" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})} />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-lg border border-gray-200">
                      <button onClick={() => setModoCitaVet("mis_pacientes")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoCitaVet === 'mis_pacientes' ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-600 hover:text-black'}`}>🐾 Mis Pacientes</button>
                      <button onClick={() => setModoCitaVet("nuevo")} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${modoCitaVet === 'nuevo' ? 'bg-white shadow text-blue-700 border border-gray-200' : 'text-gray-600 hover:text-black'}`}>➕ Nuevo Paciente</button>
                    </div>

                    {modoCitaVet === "mis_pacientes" ? (
                      <div>
                        <label className="block text-sm font-bold text-black mb-1">Selecciona de tu Lista</label>
                        <select className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})} defaultValue="">
                          <option value="" disabled className="text-gray-500">-- Elige un paciente --</option>
                          {misPacientes.length === 0 && <option value="" disabled className="text-gray-500">Aún no tienes pacientes asignados</option>}
                          {misPacientes.map((p: any) => (
                            <option key={p.id} value={p.id} className="text-black">{p.nombre} (Especie: {p.especie})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-bold text-black mb-1">ID del Nuevo Paciente</label>
                        <input type="number" placeholder="Ej. 8" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" onChange={(e) => setFormData({...formData, mascotaIdCita: e.target.value})} />
                        <p className="text-xs text-gray-600 mt-2 font-medium">Ingresa el ID del paciente que aún no forma parte de tu cartera de clientes.</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-black mt-4 mb-1">Fecha y Hora</label>
                  <input type="datetime-local" className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, fechaCita: e.target.value})} />
                </div>
                <button onClick={() => ejecutarAccionAdmin("agendar-cita", { mascota_id: formData.mascotaIdCita, fecha: formData.fechaCita })} className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">Confirmar Cita</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}