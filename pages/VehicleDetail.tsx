
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
  Calendar
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
      alert("¡Venta realizada con éxito!");
    }
  };

  if (loading || !vehicle) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Cargando...</p>
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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventory')} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Detalle de Unidad</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{vehicle.plate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <span className={cn(
                  "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  vehicle.status === 'in_stock' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                )}>{vehicle.status === 'in_stock' ? 'En Stock' : 'Vendido'}</span>
                <TrafficLight documents={documents} docTypes={docTypes} />
             </div>
             <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{vehicle.catalog_brands?.name} {vehicle.catalog_models?.name}</h2>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{vehicle.catalog_trims?.name}</p>
             </div>
             <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Precio de Lista</p>
                <p className="text-4xl font-black text-emerald-900 font-mono tracking-tighter">{formatCurrency(vehicle.list_price)}</p>
             </div>
             {vehicle.status === 'in_stock' && (
                <div className="space-y-3">
                  <button 
                    onClick={() => setShowSellModal(true)} 
                    disabled={!canSell} 
                    className={cn(
                      "w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition transform hover:-translate-y-1", 
                      canSell ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <ShoppingBag size={20} className="inline mr-2 mb-1" /> Realizar Venta
                  </button>
                  {!canSell && <p className="text-[9px] text-red-500 font-black uppercase text-center tracking-widest">Bloqueado: Revisar Documentación Crítica</p>}
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <nav className="flex bg-slate-50/50 p-2 border-b border-slate-100">
          {[
            { id: 'info', label: 'Ficha Técnica', icon: Info }, 
            { id: 'docs', label: 'Documentación', icon: FileText }, 
            { id: 'expenses', label: 'Gastos', icon: DollarSign }, 
            { id: 'profit', label: 'Balance', icon: TrendingUp }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition", activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-10">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Especificaciones</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Motor</p><p className="font-black">{vehicle.catalog_fuels?.name}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Caja</p><p className="font-black">{vehicle.catalog_transmissions?.name}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Año</p><p className="font-black">{vehicle.year}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">KM</p><p className="font-black">{vehicle.mileage.toLocaleString()}</p></div>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Fechas y Costos</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-[9px] font-bold text-blue-600 uppercase">Fecha de Toma</p><p className="font-black text-blue-900 flex items-center gap-1"><Calendar size={12}/> {formatDate(vehicle.entry_date)}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Publicado</p><p className="font-black text-emerald-600">{formatCurrency(vehicle.list_price)}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Costo Toma</p><p className="font-black text-blue-600">{formatCurrency(vehicle.take_price)}</p></div>
                </div>
              </div>
            </div>
          )}
          {/* ... resto de tabs ... */}
        </div>
      </div>
      {/* ... modales ... */}
    </div>
  );
};

export default VehicleDetail;
