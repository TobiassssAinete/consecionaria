
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuditEntry } from '../types';
import { formatDateTime } from '../lib/utils';
import { Search, History } from 'lucide-react';

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setLogs(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Cambios</h2>
        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest">Inmutable</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fecha y Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Entidad</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Acción</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">ID Entidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Cargando bitácora de auditoría...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">No hay registros de auditoría.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition text-sm">
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 uppercase text-[10px] bg-gray-100 px-2 py-0.5 rounded">{log.entity_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{log.entity_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 italic">Mostrando los últimos 100 eventos del sistema.</p>
    </div>
  );
};

export default AuditLog;
