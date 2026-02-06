
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { CatalogItem } from '../types';

interface CatalogSelectProps {
  label: string;
  table: string;
  value: string;
  onChange: (value: string) => void;
  parentId?: string;
  parentField?: string;
  disabled?: boolean;
  required?: boolean;
}

const CatalogSelect: React.FC<CatalogSelectProps> = ({
  label,
  table,
  value,
  onChange,
  parentId,
  parentField,
  disabled = false,
  required = false
}) => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [newVal, setNewVal] = useState('');

  const fetchItems = async () => {
    // Si depende de un padre y no hay ID de padre, vaciamos
    if (parentField && !parentId) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fix: Include all required fields from CatalogItem interface (needs_review, created_at) to avoid TS error on setItems
      let query = supabase
        .from(table)
        .select('id, name, is_active, needs_review, created_at')
        .eq('is_active', true)
        .order('name');

      if (parentField && parentId) {
        query = query.eq(parentField, parentId);
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        // Extraemos el mensaje de texto del error de Supabase
        const errorMessage = fetchError.message || 'Error desconocido';
        setError(errorMessage);
        console.error(`Error de Supabase en ${table}:`, fetchError);
      } else if (data) {
        setItems(data);
        if (data.length === 0) {
          setError('Tabla vacía');
        }
      }
    } catch (e: any) {
      const catchMessage = e?.message || 'Error de conexión';
      setError(catchMessage);
      console.error(`Excepción en ${table}:`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!disabled) {
      fetchItems();
    } else {
      setItems([]);
      setError(null);
    }
  }, [table, parentId, parentField, disabled]);

  const handleAddOther = async () => {
    if (!newVal.trim()) return;

    const payload: any = {
      name: newVal,
      needs_review: true,
      is_active: true
    };

    if (parentField && parentId) {
      payload[parentField] = parentId;
    }

    const { data, error: insertError } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      alert("Error al agregar item: " + insertError.message);
    } else if (data) {
      await fetchItems();
      onChange(data.id);
      setShowOtherModal(false);
      setNewVal('');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {error && (
          <div className="flex items-center gap-1 group cursor-help">
            <AlertCircle size={12} className="text-red-500" />
            <span className="text-[10px] text-red-500 font-bold truncate max-w-[120px]" title={error}>
              {error === 'permission denied' ? 'Sin Permiso SQL' : error}
            </span>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); fetchItems(); }} 
              className="text-blue-500 hover:text-blue-700"
            >
              <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === 'OTHER') {
              setShowOtherModal(true);
            } else {
              onChange(e.target.value);
            }
          }}
          disabled={disabled || loading}
          required={required}
          className={`flex-1 block w-full rounded-md shadow-sm sm:text-sm p-2 border transition ${
            error 
              ? 'border-red-300 bg-red-50 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        >
          <option value="">
            {loading ? 'Cargando...' : error ? 'Reintentar ->' : 'Seleccionar...'}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
          {!disabled && !loading && !error && <option value="OTHER">+ Agregar Nuevo</option>}
        </select>
      </div>

      {showOtherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Nuevo Item: {label}</h3>
            <input
              type="text"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              placeholder="Nombre..."
              className="w-full border p-2 rounded-md mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowOtherModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleAddOther}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogSelect;
