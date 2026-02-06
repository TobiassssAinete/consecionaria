
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
  DollarSign, 
  FileText, 
  Info, 
  Plus, 
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  AlertTriangle
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
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'expenses' | 'profit'>('info');
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<VehicleExpense | null>(null);
  
  // Venta State
  const [salePrice, setSalePrice] = useState(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [selling, setSelling] = useState(false);

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
      supabase.from('vehicle_expenses').select('*, catalog_expense_types(name)').eq('vehicle_id', id).order('expense_date', { ascending: false }),
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

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    const { error } = await supabase.from('vehicle_expenses').delete().eq('id', expenseToDelete.id);
    if (!error) {
      setExpenseToDelete(null);
      fetchData(); // Recarga inmediata para actualizar ROI
    } else {
      alert("Error al eliminar el gasto: " + error.message);
    }
  };

  const handleSell = async () => {
    if (!vehicle || !id) return;
    setSelling(true);
    
    const { error } = await supabase.rpc('sell_vehicle', {
      p_vehicle_id: id,
      p_sold_price: Number(salePrice),
      p_sold_at: new Date().toISOString(),
      p_notes: saleNotes
    });

    if (error) {
      alert("Error: " + error.message);
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
      <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Actualizando Balance Real...</p>
    </div>
  );

  // LÓGICA DE RENTABILIDAD CON FORMATO ARGENTINO
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalInvestment = Number(vehicle.take_price) + totalExpenses;
  
  const referencePrice = vehicle.status === 'sold' ? Number(vehicle.sold_price) : Number(vehicle.list_price);
  const margin = referencePrice - totalInvestment;
  const roi = totalInvestment > 0 ? (margin / totalInvestment) * 100 : 0;
  
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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventory')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{vehicle.catalog_brands?.name} {vehicle.catalog_models?.name}</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{vehicle.plate} • {vehicle.year}</p>
          </div>
        </div>
        <Link to={`/vehicles/edit/${id}`} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm">
          <Edit size={16} /> Editar Unidad
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GALERÍA */}
        <div className="lg:col-span-2 space-y-4">
           <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl group border-4 border-white">
              <img src={images[currentImgIdx]} alt="Vehículo" className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setCurrentImgIdx(i => i === 0 ? images.length - 1 : i - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/90 text-white rounded-2xl transition opacity-0 group-hover:opacity-100"><ChevronLeft size={24} /></button>
                  <button onClick={() => setCurrentImgIdx(i => i === images.length - 1 ? 0 : i + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/90 text-white rounded-2xl transition opacity-0 group-hover:opacity-100"><ChevronRight size={24} /></button>
                </>
              )}
           </div>
        </div>

        {/* PANEL DE CONTROL DE VENTA */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <span className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  vehicle.status === 'in_stock' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                )}>{vehicle.status === 'in_stock' ? 'En Stock' : 'Vendido'}</span>
                <TrafficLight documents={documents} docTypes={docTypes} />
             </div>
             
             <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Precio Publicado</p>
                <p className="text-4xl font-black text-emerald-900 font-mono tracking-tighter">{formatCurrency(vehicle.list_price)}</p>
             </div>

             {vehicle.status === 'in_stock' ? (
                <button 
                  onClick={() => setShowSellModal(true)} 
                  disabled={!canSell} 
                  className={cn(
                    "w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition transform hover:-translate-y-1", 
                    canSell ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <ShoppingBag size={20} className="inline mr-2 mb-1" /> Registrar Venta
                </button>
             ) : (
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Final Cobrado</p>
                  <p className="text-2xl font-black font-mono">{formatCurrency(vehicle.sold_price)}</p>
                </div>
             )}
          </div>

          <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 space-y-1">
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Inversión Real Acumulada</p>
            <p className="text-3xl font-black font-mono">{formatCurrency(totalInvestment)}</p>
            <p className="text-[9px] font-bold text-blue-100 uppercase mt-2">Toma + {expenses.length} gastos agregados</p>
          </div>
        </div>
      </div>

      {/* TABS PRINCIPALES */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <nav className="flex bg-slate-50/50 p-2 border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'info', label: 'Ficha Técnica', icon: Info }, 
            { id: 'docs', label: 'Gestoría', icon: FileText }, 
            { id: 'expenses', label: 'Gastos y Balance', icon: DollarSign }, 
            { id: 'profit', label: 'Rentabilidad Final', icon: TrendingUp }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition whitespace-nowrap", 
                activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-10">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Especificaciones de Unidad</h4>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Versión</p><p className="font-black text-slate-700">{vehicle.catalog_trims?.name}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">KM reales</p><p className="font-black text-slate-700 font-mono">{vehicle.mileage.toLocaleString('es-AR')} KM</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Año</p><p className="font-black text-slate-700">{vehicle.year}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Caja</p><p className="font-black text-slate-700">{vehicle.catalog_transmissions?.name}</p></div>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Negocio de Toma</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Fecha de Ingreso</p><p className="font-black text-blue-900 flex items-center gap-1"><Calendar size={14}/> {formatDate(vehicle.entry_date)}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Costo de Toma</p><p className="font-black text-blue-600 font-mono text-lg">{formatCurrency(vehicle.take_price)}</p></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documentación y Papeles</h4>
                 <TrafficLight documents={documents} docTypes={docTypes} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {docTypes.map(dt => {
                  const doc = documents.find(d => d.doc_type_id === dt.id);
                  return (
                    <div key={dt.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase text-slate-700">{dt.name}</span>
                        {dt.is_critical && <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1 mt-1"><AlertCircle size={10}/> Bloquea Venta</span>}
                      </div>
                      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border">
                        {[
                          { status: 'missing', label: 'Falta', icon: X },
                          { status: 'in_progress', label: 'Trámite', icon: Clock },
                          { status: 'ok', label: 'OK', icon: CheckCircle2 }
                        ].map(s => (
                          <button 
                            key={s.status} 
                            onClick={() => handleDocStatusChange(dt.id, s.status as DocStatus)} 
                            className={cn(
                              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all", 
                              doc?.status === s.status ? "bg-slate-900 text-white shadow-lg" : "text-slate-300 hover:text-slate-500"
                            )}
                          >
                            <s.icon size={14} />
                            <span className="text-[7px] font-black uppercase">{s.label}</span>
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
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listado de Gastos y Arreglos</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">Suma Total Arreglos: {formatCurrency(totalExpenses)}</p>
                </div>
                <button 
                  onClick={() => setShowExpenseModal(true)} 
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1"
                >
                  <Plus size={16} className="inline mr-2" /> Cargar Nuevo Gasto
                </button>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm bg-white">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 font-black uppercase text-slate-400 text-[9px] tracking-widest border-b">
                    <tr>
                      <th className="px-8 py-5">Fecha</th>
                      <th className="px-8 py-5">Concepto</th>
                      <th className="px-8 py-5">Detalle</th>
                      <th className="px-8 py-5 text-right">Importe</th>
                      <th className="px-8 py-5 text-center w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-bold uppercase italic tracking-widest">
                          Sin gastos registrados. La rentabilidad es máxima.
                        </td>
                      </tr>
                    ) : (
                      expenses.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition group">
                          <td className="px-8 py-5 text-slate-500 font-medium">{formatDate(e.expense_date)}</td>
                          <td className="px-8 py-5"><span className="font-black text-slate-700 uppercase">{e.catalog_expense_types?.name}</span></td>
                          <td className="px-8 py-5 text-slate-400 italic max-w-xs truncate">{e.notes || '-'}</td>
                          <td className="px-8 py-5 text-right font-black text-red-600 font-mono text-sm">
                            {formatCurrency(e.amount)}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <button 
                              onClick={() => setExpenseToDelete(e)} 
                              className="p-2.5 bg-slate-50 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"
                              title="Eliminar Gasto"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black uppercase tracking-widest text-[10px]">
                    <tr>
                      <td colSpan={3} className="px-8 py-5 text-right border-r border-slate-800">Inversión Extra Acumulada</td>
                      <td className="px-8 py-5 text-right font-mono text-base">{formatCurrency(totalExpenses)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profit' && (
            <div className="space-y-12 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Capital Total Puesto</p>
                    <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter tabular-nums leading-none">
                      {formatCurrency(totalInvestment)}
                    </p>
                    <div className="mt-5 pt-5 border-t border-slate-200 flex flex-col gap-1 text-[9px] font-black text-slate-400 uppercase">
                      <p>Costo de Toma: <span className="text-slate-600">{formatCurrency(vehicle.take_price)}</span></p>
                      <p>Suma Arreglos: <span className="text-red-600">{formatCurrency(totalExpenses)}</span></p>
                    </div>
                 </div>

                 <div className="p-10 bg-emerald-600 text-white rounded-[2.5rem] shadow-2xl shadow-emerald-100 text-center flex flex-col justify-center transform hover:scale-105 transition duration-500">
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-4">Margen de Ganancia Real</p>
                    <p className="text-5xl font-black font-mono tracking-tighter leading-none tabular-nums">
                      {formatCurrency(margin)}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-100 uppercase mt-6 bg-emerald-700/50 py-2 px-4 rounded-full inline-block mx-auto">
                      {vehicle.status === 'sold' ? 'Operación Concluida' : 'Proyección según Precio Lista'}
                    </p>
                 </div>

                 <div className="p-10 bg-white border-2 border-slate-100 rounded-[2.5rem] text-center flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Retorno de Inversión (ROI)</p>
                    <p className={cn(
                      "text-5xl font-black leading-none tabular-nums",
                      roi > 20 ? "text-blue-600" : roi > 10 ? "text-emerald-600" : "text-slate-700"
                    )}>{roi.toFixed(1)}%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-5 tracking-widest">Rinde por cada Peso Invertido</p>
                 </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="flex items-center gap-8">
                  <div className="p-5 bg-white/10 rounded-2xl shadow-inner">
                    <TrendingUp size={40} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black uppercase tracking-tight">Balance de Negocio</h4>
                    <p className="text-sm text-slate-400 font-medium">Análisis consolidado de gastos y beneficio neto por unidad.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Equilibrio (Break-Even)</p>
                  <p className="text-3xl font-black font-mono text-blue-400">{formatCurrency(totalInvestment)}</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">A este precio no hay ganancia ni pérdida</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (DENTRO DE LA PÁGINA) */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm p-10 space-y-8 relative border-4 border-white">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase leading-tight">¿Eliminar Gasto?</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Esta acción actualizará la rentabilidad del auto de inmediato.</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto a borrar:</p>
              <p className="text-xl font-black text-slate-800 uppercase">{expenseToDelete.catalog_expense_types?.name}</p>
              <p className="text-2xl font-black text-red-600 font-mono">{formatCurrency(expenseToDelete.amount)}</p>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                 onClick={confirmDeleteExpense} 
                 className="w-full py-5 bg-red-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-red-700 transition transform hover:-translate-y-1"
               >
                 Sí, borrar gasto
               </button>
               <button 
                 onClick={() => setExpenseToDelete(null)} 
                 className="w-full py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CARGA DE GASTO */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <form onSubmit={handleAddExpense} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 space-y-6 border-4 border-white">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <DollarSign size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Registrar Gasto Extra</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría del Arreglo</label>
                <select name="expense_type_id" required className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition">
                  {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Neto ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-red-600">$</span>
                  <input name="amount" type="number" step="1" required className="w-full bg-slate-50 border-none p-4 pl-8 rounded-xl font-black text-red-600 font-mono text-lg outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="0" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha del Gasto</label>
                <input name="expense_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observación interna</label>
                <input name="notes" type="text" className="w-full bg-slate-50 border-none p-4 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Ej: Pago service oficial, rectificación, etc." />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition">Cerrar</button>
              <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition transform hover:-translate-y-1">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE VENTA */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-10 space-y-8 relative border-4 border-white">
            <div className="text-center">
              <ArrowUpCircle className="mx-auto text-emerald-600 mb-2" size={32} />
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cerrar Venta Final</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Unidad: {vehicle.plate}</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Final de Operación</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-2xl">$</span>
                  <input 
                    type="number" 
                    value={salePrice} 
                    onChange={(e) => setSalePrice(Number(e.target.value))} 
                    className="w-full text-4xl font-black text-emerald-700 bg-emerald-50 border-none p-6 pl-12 rounded-[2rem] outline-none font-mono tracking-tighter"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentarios de la Venta</label>
                <textarea 
                  value={saleNotes} 
                  onChange={(e) => setSaleNotes(e.target.value)} 
                  className="w-full bg-slate-50 border-none p-5 rounded-2xl text-sm h-28 outline-none focus:ring-2 focus:ring-slate-900 transition" 
                  placeholder="Detalles del cliente, permutas involucradas, forma de pago..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
               <button onClick={() => setShowSellModal(false)} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition">Cancelar</button>
               <button 
                onClick={handleSell} 
                disabled={selling} 
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition transform hover:-translate-y-1 disabled:opacity-50"
               >
                 {selling ? 'Procesando...' : 'Confirmar Operación'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetail;
