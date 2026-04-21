export default function Appointments({ vetId, citas, confirmarLlegada }: any) {
  if (vetId !== "recepcion" && vetId !== "admin") return null;

  return (
    <div className="mt-10 bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
      {/* Se cambió text-gray-900 a text-black */}
      <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
        📅 Próximas Citas
      </h2>
      
      <div className="grid gap-4">
        {citas.map((cita: any) => (
          <div key={cita.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded shadow-sm text-center w-20">
                {/* Mantenemos el azul para el indicador visual, pero la hora en negro puro */}
                <p className="text-xs font-bold text-blue-700">HORA</p>
                <p className="text-lg font-black text-black">{cita.fecha ? cita.fecha.split('T')[1] : "10:00"}</p>
              </div>
              <div>
                {/* Textos del paciente y motivo en negro puro */}
                <p className="font-bold text-black">Paciente: {cita.mascota}</p>
                <p className="text-xs font-semibold text-black uppercase tracking-wider mt-0.5">{cita.motivo}</p>
              </div>
            </div>
            
            {vetId.toLowerCase() === "recepcion" && (
              <button 
                onClick={() => confirmarLlegada(cita.id)}
                className="text-xs font-bold text-emerald-700 bg-white border border-emerald-300 px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
              >
                Confirmar Llegada
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}