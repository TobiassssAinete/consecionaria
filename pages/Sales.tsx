
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sale } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Download, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { exportSalesToExcel } from '../lib/export';

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expensesMap, setExpensesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        *, 
        vehicles(
          *, 
          catalog_brands(name), 
          catalog_models(name),
          catalog_trims(name)
        )
      `)
      .order('sold_at', { ascending: false });
    
    if (salesData) {
      setSales(salesData);
      
      const vehicleIds = salesData.map(s => s.vehicle_id);
      const { data: expensesData } = await supabase
        .from('vehicle_expenses')
        .select('vehicle_id, amount')
        .in('vehicle_id', vehicleIds);
      
      const eMap: Record<string, number> = {};
      expensesData?.forEach(e => {
        eMap[e.vehicle_id] = (eMap[e.vehicle_id] || 0) + Number(e.amount);
      });
      setExpensesMap(eMap);
    }
    setLoading(false);
  };

  const totalSold = sales.reduce((acc, curr) => acc + Number(curr.sold_price), 0);
  
  // Margen REAL: Venta - (Costo Toma + Gastos)
  const totalNetMargin = sales.reduce((acc, curr) => {
    const expenses = expensesMap[curr.vehicle_id] || 0;
    const investment = Number(curr.vehicles.take_price) + expenses;
    return acc + (Number(curr.sold_price) - investment);
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Ventas</h2>
          <p className="text-sm text-slate-500 font-medium">Análisis de rentabilidad real (Venta - Inversión Total)</p>
        </div>
        <button 
          onClick={() => exportSalesToExcel(sales, expensesMap)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition text-sm font-black shadow-sm"
        >
          <Download size={18} /> EXPORTAR REPORTE CONTABLE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition">
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Margen Neto Real</p>
            <h3 className="text-3xl font-black text-emerald-700 font-mono tracking-tighter">{formatCurrency(totalNetMargin)}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition">
          <div className="p-5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition duration-300">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturación Total</p>
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(totalSold)}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition">
          <div className="p-5 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition duration-300">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo de Ventas</p>
            <h3 className="text-3xl font-black text-slate-700 font-mono tracking-tighter">{formatCurrency(totalSold - totalNetMargin)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Vehículo / Patente</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Costo Toma + Gastos</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Venta</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Ganancia Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Calculando balances...</td></tr>
              ) : (
                sales.map(s => {
                  const expenses = expensesMap[s.vehicle_id] || 0;
                  const investment = Number(s.vehicles.take_price) + expenses;
                  const margin = Number(s.sold_price) - investment;
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-base">{s.vehicles.catalog_brands?.name} {s.vehicles.catalog_models?.name}</span>
                          <span className="font-mono text-[10px] font-black text-slate-400 mt-1">{s.vehicles.plate} • {formatDate(s.sold_at)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 font-mono">{formatCurrency(investment)}</span>
                          <span className="text-[9px] text-red-400 font-black uppercase tracking-tighter">Gastos: {formatCurrency(expenses)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-black text-slate-900 font-mono text-lg">{formatCurrency(s.sold_price)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-black font-mono text-lg tracking-tighter",
                            margin >= 0 ? "text-emerald-600" : "text-red-600"
                          )}>
                            {formatCurrency(margin)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                            ROI: {investment > 0 ? ((margin / investment) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
