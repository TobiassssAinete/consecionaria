
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Vehicle, 
  VehicleDocument, 
  VehicleExpense, 
  DocType, 
  DocStatus, 
  CatalogItem 
} from '../types';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  DollarSign, 
  FileText, 
  Info, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  ShoppingBag,
  Camera,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  RefreshCcw,
  Scale
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import TrafficLight from '../components/TrafficLight';

const VehicleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [expenses, setExpenses] = useState<VehicleExpense[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'expenses' | 'profit' | 'tradein'>('info');
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [salePrice, setSalePrice] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [selling, setSelling] = useState(false);

  // Trade-in (Permuta) States
  const [tradeInValue, setTradeInValue] = useState(0);
  const [tradeInVehicleName, setTradeInVehicleName] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);

    const [vRes, dRes, dtRes, eRes, etRes] = await Promise.all([
      supabase.from('vehicles').select('*, catalog_brands(name), catalog_models(name), catalog_trims(name), catalog_fuels(name), catalog_transmissions(name), catalog_colors(name)').eq('id', id).single(),
      supabase.from('vehicle_documents').select('*, catalog_doc_types(*)').eq('vehicle_id', id),
      supabase.from('catalog_doc_types').select('*').eq('is_active', true).order('is_critical', { ascending: false }),
      supabase.from('vehicle_expenses').select('*, catalog_expense_types(name)').eq('vehicle_id', id),
      supabase.from('catalog_expense_types').select('*').eq('is_active', true).order('name')
    ]);

    if (vRes.data) {
      setVehicle(vRes.data);
      setSalePrice(Number(vRes.data.list_price) || 0);
    }
    if (dRes.data) setDocuments(dRes.data);
    if (dtRes.data) setDocTypes(dtRes.data);
    if (eRes.data) setExpenses(eRes.data);
    if (etRes.data) setExpenseTypes(etRes.data);

    setLoading(false);
  };

  const handleDocStatusChange = async (docTypeId: string, newStatus: DocStatus) => {
    const existing = documents.find(d => d.doc_type_id === docTypeId);
    if (existing) {
      await supabase.from('vehicle_documents').update({ status: newStatus }).eq('id', existing.id);
    } else {
      await supabase.from('vehicle_documents').insert({ vehicle_id: id, doc_type_id: docTypeId, status: newStatus });
    }
    fetchData();
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      vehicle_id: id,
      expense_type_id: formData.get('expense_type_id') as string,
      amount: Number(formData.get('amount')),
      expense_date: formData.get('expense_date') as string,
      notes: formData.get('notes') as string,
    };

    const { error } = await supabase.from('vehicle_expenses').insert(payload);
    if (!error) {
      setShowExpenseModal(false);
      fetchData();
    } else {
      alert(error.message);
    }
  };

  const handleSell = async () => {
    if (!vehicle || !id) return;
    setSelling(true);
    
    const { error } = await supabase.rpc('sell_vehicle', {
      p_vehicle_id: id,
      p_sold_price: salePrice,
      p_sold_at: new Date().toISOString(),
      p_notes: saleNotes
    });

    if (error) {
      alert("Error al vender: " + error.message);
      setSelling(false);
    } else {
      setShowSellModal(false);
      fetchData();
      setSelling(false);
    }
  };

  if (loading || !vehicle) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Cargando Unidad...</p>
    </div>
  );

  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalInvestment = Number(vehicle.take_price) + totalExpenses;
  const projectedMargin = Number(vehicle.list_price) - totalInvestment;
  const projectedROI = totalInvestment > 0 ? (projectedMargin / totalInvestment) * 100 : 0;
  
  const criticalTypes = docTypes.filter(dt => dt.is_critical);
  const canSell = criticalTypes.every(ct => {
    const doc = documents.find(d => d.doc_type_id === ct.id);
    return doc?.status === 'ok';
  });

  const images = vehicle.image_urls && vehicle.image_urls.length > 0 
    ? vehicle.image_urls 
    : ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl group border-4 border-white">
              <img 
                src={images[currentImgIdx]} 
                alt="Vehículo" 
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setCurrentImgIdx(i => i === 0 ? images.length - 1 : i - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/90 text-white hover:text-slate-900 backdrop-blur-md rounded-2xl transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={() => setCurrentImgIdx(i => i === images.length - 1 ? 0 : i + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/90 text-white hover:text-slate-900 backdrop-blur-md rounded-2xl transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <div key={i} className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === currentImgIdx ? "w-8 bg-white" : "w-2 bg-white/40"
                      )} />
                    ))}
                  </div>
                </>
              )}
           </div>
           {images.length > 1 && (
             <div className="flex gap-4 overflow-x-auto pb-2 px-1">
               {images.map((url, i) => (
                 <button 
                    key={i} 
                    onClick={() => setCurrentImgIdx(i)}
                    className={cn(
                      "relative shrink-0 w-24 aspect-video rounded-xl overflow-hidden border-2 transition",
                      i === currentImgIdx ? "border-blue-600 scale-105" : "border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                    )}
                 >
                   <img src={url} className="w-full h-full object-cover" />
                 </button>
               ))}
             </div>
           )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <span className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  vehicle.status === 'in_stock' ? "bg-emerald-100 text-emerald-700" :
                  vehicle.status === 'reserved' ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-700"
                )}>
                  {vehicle.status === 'in_stock' ? 'En Salón' : vehicle.status === 'reserved' ? 'Reservado' : 'Vendido'}
                </span>
                <TrafficLight documents={documents} docTypes={docTypes} />
             </div>

             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">
                  {vehicle.catalog_brands?.name} {vehicle.catalog_models?.name}
                </h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{vehicle.catalog_trims?.name}</p>
             </div>

             <div className="flex flex-col gap-1 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Precio de Lista</p>
                <p className="text-4xl font-black text-emerald-900 font-mono tracking-tighter">{formatCurrency(vehicle.list_price)}</p>
             </div>

             {vehicle.status === 'in_stock' && (
                <button 
                  onClick={() => setShowSellModal(true)}
                  disabled={!canSell}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition transform hover:-translate-y-1",
                    canSell ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <ShoppingBag size={20} /> Realizar Venta
                </button>
             )}

             <Link 
              to={`/vehicles/edit/${vehicle.id}`}
              className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition"
            >
              <Edit size={16} /> Editar Detalles Técnicos
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Total</p>
                <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(totalInvestment)}</p>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Año / Kms</p>
                <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">{vehicle.year} • {vehicle.mileage.toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <nav className="flex bg-slate-50/50 p-2 border-b border-slate-100 overflow-x-auto scrollbar-hide">
          {[
            { id: 'info', label: 'Especificaciones', icon: Info },
            { id: 'docs', label: 'Documentación', icon: FileText },
            { id: 'expenses', label: 'Gastos', icon: DollarSign },
            { id: 'profit', label: 'Rentabilidad', icon: TrendingUp },
            { id: 'tradein', label: 'Permuta', icon: RefreshCcw },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-10">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
              <div className="space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Ficha Mecánica</h3>
                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marca / Modelo</dt><dd className="font-bold text-slate-900">{vehicle.catalog_brands?.name} {vehicle.catalog_models?.name}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versión</dt><dd className="font-bold text-slate-900">{vehicle.catalog_trims?.name}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transmisión</dt><dd className="font-bold text-slate-900">{vehicle.catalog_transmissions?.name}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motorización</dt><dd className="font-bold text-slate-900">{vehicle.catalog_fuels?.name}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Color Exterior</dt><dd className="font-bold text-slate-900">{vehicle.catalog_colors?.name}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificación</dt><dd className="font-mono font-black text-blue-600">{vehicle.plate}</dd></div>
                </div>
              </div>
              <div className="space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Precios de Referencia</h3>
                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Toma</dt><dd className="font-bold text-slate-900">{formatCurrency(vehicle.take_price)}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">InfoAuto</dt><dd className="font-bold text-slate-900">{formatCurrency(vehicle.info_price)}</dd></div>
                  <div className="flex flex-col"><dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sugerido Mercado</dt><dd className="font-bold text-slate-900">{formatCurrency(vehicle.suggested_price)}</dd></div>
                  <div className="flex flex-col p-4 bg-emerald-50 rounded-2xl border border-emerald-100"><dt className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Precio Publicado</dt><dd className="font-black text-emerald-900 text-xl font-mono">{formatCurrency(vehicle.list_price)}</dd></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Estado de Gestoría</h3>
                <TrafficLight documents={documents} docTypes={docTypes} className="scale-110" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                {docTypes.map(dt => {
                  const doc = documents.find(d => d.doc_type_id === dt.id);
                  return (
                    <div key={dt.id} className="py-4 flex items-center justify-between border-b border-slate-50 last:border-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">{dt.name}</span>
                        {dt.is_critical && (
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1 italic">Obligatorio para Venta</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                        {(['missing', 'in_progress', 'ok'] as DocStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => handleDocStatusChange(dt.id, status)}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase transition",
                              doc?.status === status 
                                ? (status === 'ok' ? "bg-emerald-600 text-white shadow-md shadow-emerald-100" : status === 'in_progress' ? "bg-amber-500 text-white" : "bg-red-600 text-white")
                                : "text-slate-400 hover:bg-slate-200"
                            )}
                          >
                            {status === 'missing' ? 'Falta' : status === 'in_progress' ? 'Trámite' : 'OK'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Mantenimiento y Arreglos</h3>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition shadow-lg"
                >
                  <Plus size={14} /> Registrar Gasto
                </button>
              </div>
              {expenses.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                   <DollarSign className="mx-auto text-slate-300 mb-4" size={48} />
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sin gastos registrados todavía.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-[2rem]">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {expenses.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition">
                          <td className="px-8 py-5 text-slate-500 font-medium">{formatDate(e.expense_date)}</td>
                          <td className="px-8 py-5 font-black text-slate-800 uppercase text-xs tracking-tight">{e.catalog_expense_types?.name}</td>
                          <td className="px-8 py-5 text-slate-400 italic text-xs">{e.notes || '-'}</td>
                          <td className="px-8 py-5 text-right font-black text-red-600 font-mono tracking-tighter">{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-black uppercase">
                      <tr>
                        <td colSpan={3} className="px-8 py-6 text-right text-[10px] tracking-widest">Inversión acumulada en mantenimiento:</td>
                        <td className="px-8 py-6 text-right font-mono text-lg tracking-tighter">{formatCurrency(totalExpenses)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profit' && (
            <div className="space-y-12 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Análisis Proyectado de Ganancia</h3>
                <p className="text-2xl font-black text-slate-900">¿Cuánto estamos ganando con esta unidad?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Toma</p>
                    <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(vehicle.take_price)}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">+ Gastos de Puesta en Valor</p>
                    <p className="text-2xl font-black text-red-600 font-mono">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-[2rem] text-white flex flex-col justify-center items-center text-center shadow-xl shadow-blue-100">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Inversión Total Real</p>
                  <p className="text-4xl font-black font-mono tracking-tighter">{formatCurrency(totalInvestment)}</p>
                  <div className="mt-4 px-3 py-1 bg-blue-500 rounded-full text-[10px] font-bold uppercase">Base de Costo</div>
                </div>

                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Margen Neto Proyectado</p>
                    <p className="text-4xl font-black text-emerald-700 font-mono tracking-tighter">{formatCurrency(projectedMargin)}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-emerald-200">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Retorno de Inversión (ROI)</p>
                    <p className="text-3xl font-black text-emerald-700">{projectedROI.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-slate-50 space-y-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-blue-600" size={24} />
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Consideraciones Contables</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Este cálculo utiliza el <strong>Precio de Lista</strong> actual. Cualquier descuento otorgado en la negociación final 
                  reducirá proporcionalmente el margen neto. El costo de mantenimiento incluye repuestos, mano de obra y gestoría ya abonada.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tradein' && (
            <div className="space-y-10 max-w-4xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Cotizador de Diferencia</h3>
                <p className="text-2xl font-black text-slate-900">Calculadora de Permuta</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo del Cliente (Toma)</label>
                    <input 
                      type="text"
                      placeholder="Ej: Ford Focus 2017 SE"
                      value={tradeInVehicleName}
                      onChange={(e) => setTradeInVehicleName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl font-bold focus:bg-white focus:border-blue-600 outline-none transition"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor de Toma Ofertado</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                       <input 
                        type="number"
                        placeholder="0"
                        value={tradeInValue || ''}
                        onChange={(e) => setTradeInValue(Number(e.target.value))}
                        className="w-full bg-slate-50 border-2 border-transparent p-4 pl-8 rounded-2xl font-black text-2xl font-mono focus:bg-white focus:border-emerald-600 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Scale size={120} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nuestra Unidad</p>
                    <p className="text-xl font-black text-slate-200">{formatCurrency(vehicle.list_price)}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Su Unidad ({tradeInVehicleName || 'Usado'})</p>
                    <p className="text-xl font-black text-red-400">- {formatCurrency(tradeInValue)}</p>
                  </div>

                  <div className="pt-8 border-t border-slate-800">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Diferencia a Cobrar</p>
                    <p className="text-5xl font-black font-mono tracking-tighter text-emerald-400">
                      {formatCurrency(Math.max(0, Number(vehicle.list_price) - tradeInValue))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Venta */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border-4 border-white">
            <div className="p-10 bg-emerald-600 text-white text-center">
              <ShoppingBag className="mx-auto mb-4" size={48} />
              <h3 className="text-3xl font-black tracking-tight leading-none uppercase">Cerrar Venta</h3>
              <p className="text-emerald-100 font-medium mt-2">¿Confirmamos la salida de la unidad?</p>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center block">Precio de Venta Final</label>
                <input 
                  type="number" 
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full text-5xl font-black text-emerald-700 bg-emerald-50 border-none p-6 rounded-[2rem] text-center focus:ring-4 focus:ring-emerald-200 outline-none font-mono tracking-tighter"
                />
                <div className="flex justify-between items-center px-2">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Margen Neto Real</p>
                   <p className="text-lg font-black text-emerald-600 font-mono">{formatCurrency(salePrice - totalInvestment)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Comentarios de Operación</label>
                <textarea 
                  rows={2}
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Ej: Entrega de usado en parte de pago, permuta, crédito prendario..."
                  className="w-full bg-slate-50 border-none p-5 rounded-2xl focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 px-4 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSell}
                  disabled={selling}
                  className="flex-1 px-4 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] hover:bg-slate-800 shadow-xl shadow-slate-200 disabled:opacity-50 transition transform hover:-translate-y-1"
                >
                  {selling ? 'Registrando...' : 'Confirmar Operación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gastos */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
          <form onSubmit={handleAddExpense} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 space-y-6">
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <DollarSign size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cargar Gasto</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                <select name="expense_type_id" required className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500">
                  {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe</label>
                <input name="amount" type="number" step="0.01" required className="w-full bg-slate-50 border-none p-4 rounded-xl font-black text-red-600 font-mono text-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                <input name="expense_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Adicionales</label>
                <input name="notes" type="text" className="w-full bg-slate-50 border-none p-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500" placeholder="Ej: Pago en efectivo..." />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cancelar</button>
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleDetail;
