
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import CatalogSelect from '../components/CatalogSelect';
import ImageUpload from '../components/ImageUpload';
import { cn, formatNumberForInput, parseCurrencyString } from '../lib/utils';
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  Camera, 
  DollarSign, 
  TrendingUp, 
  Info, 
  Calendar,
  CheckCircle2,
  Loader2
} from 'lucide-react';

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
}

const FinancialInput: React.FC<FinancialInputProps> = ({ label, value, onChange, icon: Icon, colorClass, description }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    
    // Guardamos posición del cursor para que no salte al reformatear
    const selectionStart = input.selectionStart || 0;
    const dotsBefore = (rawValue.substring(0, selectionStart).match(/\./g) || []).length;
    
    const numericValue = parseCurrencyString(rawValue);
    onChange(numericValue);

    // Reajustar posición del cursor después del render
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
    <div className="space-y-2 group">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">{label}</label>
        {description && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">{description}</span>}
      </div>
      <div className={cn(
        "relative flex items-center rounded-[1.5rem] overflow-hidden border-2 transition-all duration-300 focus-within:shadow-xl focus-within:shadow-blue-50/50",
        colorClass.border,
        "focus-within:ring-4 focus-within:ring-opacity-20 " + colorClass.ring
      )}>
        <div className={cn(
          "flex items-center justify-center w-14 h-14 border-r-2 transition-colors",
          colorClass.bg,
          colorClass.text
        )}>
          <span className="font-black font-mono text-xl">$</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            "w-full h-14 bg-white outline-none font-mono font-black tracking-tighter text-2xl px-5 transition-colors",
            colorClass.textInput
          )}
          placeholder="0"
        />
        {Icon && (
          <div className="absolute right-5 text-slate-200 pointer-events-none group-focus-within:text-slate-400 transition-colors">
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
  const [success, setSuccess] = useState(false);

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
    image_urls: [] as string[],
    entry_date: new Date().toISOString().split('T')[0]
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
        image_urls: data.image_urls || [],
        entry_date: data.entry_date || new Date().toISOString().split('T')[0]
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación básica
    if (!formData.brand_id || !formData.model_id || !formData.plate.trim()) {
      setError("Faltan datos obligatorios (Marca, Modelo o Patente).");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      plate: formData.plate.toUpperCase().trim(),
      updated_by: session?.user?.id,
      updated_at: new Date().toISOString()
    };

    try {
      if (id) {
        // ACTUALIZACIÓN
        const { error: updateError } = await supabase
          .from('vehicles')
          .update(payload)
          .eq('id', id);

        if (updateError) {
          // Detectar error de patente duplicada en PostgreSQL (Código 23505)
          if (updateError.code === '23505') {
            throw new Error("La patente ingresada ya pertenece a otro vehículo en el inventario.");
          }
          throw updateError;
        }

        setSuccess(true);
        setTimeout(() => navigate(`/vehicles/${id}`), 1000);
      } else {
        // NUEVA TOMA
        const { data: insertedData, error: insertError } = await supabase
          .from('vehicles')
          .insert({
            ...payload,
            created_by: session?.user?.id,
            status: 'in_stock'
          })
          .select()
          .single();
        
        if (insertError) {
          if (insertError.code === '23505') {
            throw new Error("Esta patente ya está registrada en el sistema. Verificá los datos o buscá la unidad en el inventario.");
          }
          throw insertError;
        }

        setSuccess(true);
        if (insertedData) {
          setTimeout(() => navigate(`/vehicles/${insertedData.id}`), 1000);
        }
      }
    } catch (err: any) {
      console.error("Error al guardar vehículo:", err);
      setError(err.message || "Ocurrió un error inesperado al intentar guardar.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition shadow-sm">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {id ? 'Editar Unidad' : 'Nueva Toma'}
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
              {id ? 'Actualizando datos del vehículo' : 'Registro de ingreso a stock'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[1.5rem] flex items-center gap-5 text-red-700 animate-in slide-in-from-top-2">
            <div className="bg-red-600 text-white p-3 rounded-2xl shadow-lg shadow-red-200/50"><AlertCircle size={24} /></div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest mb-1">Conflicto al Guardar</p>
              <p className="text-sm font-bold">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[1.5rem] flex items-center gap-5 text-emerald-700 animate-in slide-in-from-top-2">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200/50"><CheckCircle2 size={24} /></div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest mb-1">¡Operación Exitosa!</p>
              <p className="text-sm font-bold">La unidad se guardó correctamente. Redirigiendo...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* IMÁGENES */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Camera size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Galería de Fotos</h3>
              </div>
              <ImageUpload images={formData.image_urls} onChange={(urls) => setFormData({ ...formData, image_urls: urls })} />
            </div>

            {/* INFORMACIÓN TÉCNICA */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl"><Info size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ficha Técnica</h3>
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
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-xl outline-none"
                    placeholder="ABC 123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Año Fabricación</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-xl outline-none"
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
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:border-blue-500 focus:bg-white transition-all font-mono font-black text-xl outline-none pr-14"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">KM</span>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-2 block flex items-center gap-1">
                    <Calendar size={14} /> Fecha Ingreso Stock
                  </label>
                  <input
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    required
                    className="w-full bg-blue-50 border-2 border-blue-50 p-4 rounded-2xl focus:border-blue-500 focus:bg-white transition-all font-black text-lg outline-none text-blue-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GESTIÓN FINANCIERA */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl sticky top-8 space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={20} /></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Precio y Negocio</h3>
              </div>

              <div className="space-y-6">
                <FinancialInput 
                  label="Precio de Toma" 
                  description="Lo que se pagó"
                  value={formData.take_price} 
                  onChange={(v: number) => setFormData({ ...formData, take_price: v })}
                  colorClass={{ bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600', ring: 'ring-blue-500', textInput: 'text-blue-900' }}
                />

                <FinancialInput 
                  label="Precio de Lista" 
                  description="Lo que se pide"
                  value={formData.list_price} 
                  onChange={(v: number) => setFormData({ ...formData, list_price: v })}
                  icon={TrendingUp}
                  colorClass={{ bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-600', ring: 'ring-emerald-500', textInput: 'text-emerald-900' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-6 rounded-[1.5rem] shadow-2xl font-black text-sm uppercase tracking-widest transition transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed",
                  success ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : success ? <CheckCircle2 size={24} /> : <Save size={24} />}
                {loading ? 'Guardando...' : success ? 'Unidad Guardada' : id ? 'Actualizar Ficha' : 'Confirmar Ingreso'}
              </button>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">ROI Proyectado</p>
                <p className="text-3xl font-black text-slate-800 font-mono tracking-tighter text-center">
                  {formData.list_price - formData.take_price > 0 ? '+' : ''}
                  {((formData.list_price - (formData.take_price || 1)) / (formData.take_price || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
