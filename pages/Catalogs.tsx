
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CatalogItem } from '../types';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const Catalogs: React.FC = () => {
  const [activeCatalog, setActiveCatalog] = useState<string>('catalog_brands');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const catalogs = [
    { id: 'catalog_brands', label: 'Marcas' },
    { id: 'catalog_fuels', label: 'Combustibles' },
    { id: 'catalog_transmissions', label: 'Transmisiones' },
    { id: 'catalog_colors', label: 'Colores' },
    { id: 'catalog_expense_types', label: 'Tipos de Gasto' },
    { id: 'catalog_doc_types', label: 'Tipos de Doc' },
  ];

  useEffect(() => {
    fetchItems();
  }, [activeCatalog]);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from(activeCatalog).select('*').order('needs_review', { ascending: false }).order('name');
    if (data) setItems(data);
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from(activeCatalog).update({ is_active: !current }).eq('id', id);
    fetchItems();
  };

  const approveItem = async (id: string) => {
    await supabase.from(activeCatalog).update({ needs_review: false }).eq('id', id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Maestros de Datos</h2>

      <div className="flex flex-wrap gap-2">
        {catalogs.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCatalog(c.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition",
              activeCatalog === c.id ? "bg-blue-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Revisión</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Activo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={3} className="p-12 text-center">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={3} className="p-12 text-center text-gray-400">Sin ítems.</td></tr>
            ) : (
              items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4">
                    {item.needs_review ? (
                      <button 
                        onClick={() => approveItem(item.id)}
                        className="flex items-center gap-1 text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition"
                      >
                        <AlertCircle size={14} /> Aprobar
                      </button>
                    ) : (
                      <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Válido</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleActive(item.id, item.is_active)}
                      className={cn(
                        "p-1 rounded transition",
                        item.is_active ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 hover:bg-gray-100"
                      )}
                    >
                      {item.is_active ? <Check size={20} /> : <X size={20} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Catalogs;
