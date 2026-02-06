
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Vehicle, DocType, VehicleDocument } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Plus, Eye, Edit, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import TrafficLight from '../components/TrafficLight';
import { exportVehiclesToExcel } from '../lib/export';

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [docs, setDocs] = useState<Record<string, VehicleDocument[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('in_stock');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    
    let query = supabase
      .from('vehicles')
      .select(`
        *, 
        catalog_brands(name), 
        catalog_models(name), 
        catalog_trims(name),
        catalog_fuels(name),
        catalog_transmissions(name),
        catalog_colors(name)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: vData } = await query;
    if (vData) setVehicles(vData);

    const { data: dtData } = await supabase.from('catalog_doc_types').select('*').eq('is_active', true);
    if (dtData) setDocTypes(dtData);

    if (vData && vData.length > 0) {
      const vIds = vData.map(v => v.id);
      const { data: dData } = await supabase.from('vehicle_documents').select('*').in('vehicle_id', vIds);
      if (dData) {
        const grouped = dData.reduce((acc, curr) => {
          if (!acc[curr.vehicle_id]) acc[curr.vehicle_id] = [];
          acc[curr.vehicle_id].push(curr);
          return acc;
        }, {} as Record<string, VehicleDocument[]>);
        setDocs(grouped);
      }
    }
    
    setLoading(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    `${v.catalog_brands?.name} ${v.catalog_models?.name} ${v.plate} ${v.year}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inventario de Unidades</h2>
          <p className="text-sm text-slate-500 font-medium">Control total de stock físico y legal</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => exportVehiclesToExcel(filteredVehicles)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition text-sm font-black shadow-sm"
          >
            <Download size={18} /> EXCEL
          </button>
          <Link to="/vehicles/new" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition text-sm font-black shadow-lg shadow-blue-100">
            <Plus size={18} /> AGREGAR UNIDAD
          </Link>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, patente o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 px-4 py-1 rounded-2xl">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none py-3 text-sm font-black text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">TODOS LOS ESTADOS</option>
            <option value="in_stock">EN STOCK</option>
            <option value="reserved">RESERVADOS</option>
            <option value="sold">VENDIDOS</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Portada</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehículo Detalle</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ficha Técnica</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Precio Venta</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Situación Legal</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-full mb-2" />
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando Inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-xs">
                    No se encontraron unidades con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50/40 transition group cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                    <td className="px-8 py-6">
                      <div className="w-20 aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                        {v.image_urls && v.image_urls.length > 0 ? (
                          <img src={v.image_urls[0]} alt="Portada" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-300" size={20} />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg leading-tight tracking-tight group-hover:text-blue-700 transition">{v.catalog_brands?.name} {v.catalog_models?.name}</span>
                        <span className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{v.catalog_trims?.name}</span>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{v.catalog_fuels?.name}</span>
                           <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{v.catalog_transmissions?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-slate-900 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs w-fit shadow-md">{v.plate}</span>
                        <span className="text-xs text-slate-500 font-black mt-2 uppercase">{v.year} • {v.mileage.toLocaleString()} KM</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-2xl tracking-tighter font-mono tabular-nums leading-none">
                          {formatCurrency(v.list_price)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Precio de Salida</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <TrafficLight documents={docs[v.id] || []} docTypes={docTypes} />
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/vehicles/${v.id}`}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition"
                          title="Ficha"
                        >
                          <Eye size={22} />
                        </Link>
                        <Link 
                          to={`/vehicles/edit/${v.id}`}
                          className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition"
                          title="Editar"
                        >
                          <Edit size={22} />
                        </Link>
                        <div className="p-3 text-slate-200 group-hover:text-slate-400 transition">
                          <ChevronRight size={22} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
