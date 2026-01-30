
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import CatalogSelect from '../components/CatalogSelect';
import ImageUpload from '../components/ImageUpload';
import { cn, formatNumberForInput, parseCurrencyString } from '../lib/utils';
import { ArrowLeft, Save, AlertCircle, Camera, DollarSign, TrendingUp, Info, BarChart4, Zap } from 'lucide-react';

/**
 * COMPONENTE DE INPUT FINANCIERO (DEFINIDO AFUERA PARA EVITAR RE-MOUNTS)
 * Ahora permite escribir de corrido sin saltos de cursor ni pérdida de foco.
 */
interface FinancialInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: any;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    textInput: string;
  };
  description?: string;
  small?: boolean;
}

const FinancialInput: React.FC<FinancialInputProps> = ({ label, value, onChange, icon: Icon, colorClass, description, small = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    
    // Guardamos posición actual del cursor
    const selectionStart = input.selectionStart || 0;
    
    // Contamos puntos antes de la edición
    const dotsBefore = (rawValue.substring(0, selectionStart).match(/\./g) || []).length;
    
    // Obtenemos el número real
    const numericValue = parseCurrencyString(rawValue);
    onChange(numericValue);

    // Reajustamos cursor después de que React actualice el DOM
    setTimeout(() => {
      if (inputRef.current) {
        const newValue = inputRef.current.value;
        const dotsAfter = (newValue.substring(0, selectionStart).match(/\./g) || []).length;
        const diff = dotsAfter - dotsBefore;
        const newPos = selectionStart + diff;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const displayValue = value === 0 ? '' : formatNumberForInput(value);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        {description && <span className="text-[9px] text-slate-400 font-medium italic">{description}</span>}
      </div>
      <div className={cn(
        "relative flex items-center rounded-2xl overflow-hidden border-2 transition-all focus-within:ring-4 focus-within:ring-opacity-20",
        colorClass.border,
        "focus-within:" + colorClass.ring
      )}>
        <div className={cn(
          "flex items-center justify-center border-r-2 transition-colors",
          small ? 'w-10 h-10' : 'w-14 h-14',
          colorClass.bg,
          colorClass.text
        )}>
          <span className={cn("font-black font-mono", small ? 'text-sm' : 'text-xl')}>$</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            "w-full bg-white outline-none font-mono font-black tracking-tighter transition-colors",
            small ? 'h-10 text-lg px-3' : 'h-14 text-2xl px-4',
            colorClass.textInput
          )}
          placeholder="0"
        />
        {Icon && !small && (
          <div className="absolute right-4 text-slate-200 pointer-events-none">
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

const VehicleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brand_id: '',
    model_id: '',
    trim_id: '',
    fuel_id: '',
    transmission_id: '',
    color_id: '',
    year: new Date().getFullYear(),
    mileage: 0,
    plate: '',
    take_price: 0,
    info_price: 0,
    zero_km_price: 0,
    suggested_price: 0,
    list_price: 0,
    image_urls: [] as string[]
  });

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).single();
    if (data) {
      setFormData({
        brand_id: data.brand_id,
        model_id: data.model_id,
        trim_id: data.trim_id,
        fuel_id: data.fuel_id,
        transmission_id: data.transmission_id,
        color_id: data.color_id,
        year: data.year,
        mileage: data.mileage,
        plate: data.plate,
        take_price: Number(data.take_price),
        info_price: Number(data.info_price || 0),
        zero_km_price: Number(data.zero_km_price || 0),
        suggested_price: Number(data.suggested_price || 0),
        list_price: Number(data.list_price || 0),
        image_urls: data.image_urls || []
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      updated_by: session?.user?.id,
      updated_at: new Date().toISOString()
    };

    if (id) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', id);
      if (error) setError(error.message);
      else navigate(`/vehicles/${id}`);
    } else {
      const { data, error } = await supabase.from('vehicles').insert({
        ...payload,
        created_by: session?.user?.id,
        status: 'in_stock'
      }).select().single();
      
      if (error) setError(error.message);
      else if (data) navigate(`/vehicles/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition shadow-sm">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {id ? 'Editar Unidad' : 'Nueva Toma'}
            </h2>
            <p className="text-slate-500 font-medium text-lg">Control de Stock e Inversión</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Camera size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Galería de Imágenes</h3>
              </div>
              <ImageUpload images={formData.image_urls} onChange={(urls) => setFormData({ ...formData, image_urls: urls })} />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl"><Info size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Información Técnica</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CatalogSelect label="Marca" table="catalog_brands" value={formData.brand_id} onChange={(v) => setFormData({ ...formData, brand_id: v, model_id: '', trim_id: '' })} required />
                <CatalogSelect label="Modelo" table="catalog_models" parentField="brand_id" parentId={formData.brand_id} value={formData.model_id} onChange={(v) => setFormData({ ...formData, model_id: v, trim_id: '' })} disabled={!formData.brand_id} required />
                <CatalogSelect label="Versión" table="catalog_trims" parentField="model_id" parentId={formData.model_id} value={formData.trim_id} onChange={(v) => setFormData({ ...formData, trim_id: v })} disabled={!formData.model_id} required />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <CatalogSelect label="Combustible" table="catalog_fuels" value={formData.fuel_id} onChange={(v) => setFormData({ ...formData, fuel_id: v })} required />
                <CatalogSelect label="Transmisión" table="catalog_transmissions" value={formData.transmission_id} onChange={(v) => setFormData({ ...formData, transmission_id: v })} required />
                <CatalogSelect label="Color" table="catalog_colors" value={formData.color_id} onChange={(v) => setFormData({ ...formData, color_id: v })} required />
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Patente</label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-lg outline-none"
                    placeholder="ABC 123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Año</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-lg outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kilometraje</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberForInput(formData.mileage)}
                      onChange={(e) => setFormData({ ...formData, mileage: parseCurrencyString(e.target.value) })}
                      required
                      className="w-full bg-slate-50 border-2 border-slate-50 p-3 rounded-xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-lg outline-none pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">KM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gestión Financiera</h3>
              </div>

              <div className="space-y-5">
                <FinancialInput 
                  label="Precio de Toma" 
                  description="Costo de ingreso"
                  value={formData.take_price} 
                  onChange={(v: number) => setFormData({ ...formData, take_price: v })}
                  colorClass={{ bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600', ring: 'ring-blue-500', textInput: 'text-blue-900' }}
                />

                <FinancialInput 
                  label="Precio de Lista" 
                  description="Venta al público"
                  value={formData.list_price} 
                  onChange={(v: number) => setFormData({ ...formData, list_price: v })}
                  icon={TrendingUp}
                  colorClass={{ bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600', ring: 'ring-emerald-500', textInput: 'text-emerald-900' }}
                />

                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                   <FinancialInput 
                    label="InfoAuto" 
                    value={formData.info_price} 
                    onChange={(v: number) => setFormData({ ...formData, info_price: v })}
                    small
                    colorClass={{ bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', ring: 'ring-slate-400', textInput: 'text-slate-700' }}
                  />
                  
                  <FinancialInput 
                    label="Precio 0km" 
                    value={formData.zero_km_price} 
                    onChange={(v: number) => setFormData({ ...formData, zero_km_price: v })}
                    small
                    colorClass={{ bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', ring: 'ring-slate-400', textInput: 'text-slate-700' }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">Utilidad Bruta</span>
                  <span className="text-emerald-600 font-mono text-base font-black">
                    ${(formData.list_price - formData.take_price).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 shadow-2xl font-black text-sm uppercase tracking-widest transition transform hover:-translate-y-1 disabled:opacity-50"
              >
                <Save size={20} />
                {loading ? 'Guardando...' : id ? 'Actualizar Vehículo' : 'Confirmar Ingreso'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
