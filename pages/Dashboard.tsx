
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  PlusCircle, 
  BarChart3,
  ArrowUpRight,
  Wallet,
  Coins
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/utils';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalTakePrice: 0,
    totalPotentialPrice: 0,
    totalDifference: 0,
    totalSales: 0,
    avgMargin: 0
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Datos de Unidades en Stock
      const { data: stockData } = await supabase
        .from('vehicles')
        .select('id, take_price, list_price, catalog_brands(name), catalog_models(name)')
        .eq('status', 'in_stock');

      // 2. Datos de Ventas Realizadas
      const { data: soldData } = await supabase
        .from('sales')
        .select('vehicle_id, sold_price, sold_at, vehicles(take_price, catalog_brands(name), catalog_models(name))');

      // 3. Gastos para cálculo de rentabilidad real en ventas
      const soldIds = soldData?.map(s => s.vehicle_id) || [];
      const { data: soldExpenses } = await supabase
        .from('vehicle_expenses')
        .select('vehicle_id, amount')
        .in('vehicle_id', soldIds);
      
      const soldExpensesMap: Record<string, number> = {};
      soldExpenses?.forEach(e => {
        soldExpensesMap[e.vehicle_id] = (soldExpensesMap[e.vehicle_id] || 0) + Number(e.amount);
      });

      // --- CÁLCULOS PRINCIPALES ---
      const totalStock = stockData?.length || 0;
      
      // Capital Activo (Solo sumatoria de precios de toma según pedido)
      const totalTakePrice = stockData?.reduce((acc, curr) => acc + Number(curr.take_price), 0) || 0;
      
      // Capital Potencial al Público (Sumatoria de precios de lista)
      const totalPotentialPrice = stockData?.reduce((acc, curr) => acc + Number(curr.list_price || 0), 0) || 0;
      
      // Diferencia Proyectada
      const totalDifference = totalPotentialPrice - totalTakePrice;

      // Ventas Totales (Histórico)
      const totalSales = soldData?.reduce((acc, curr) => acc + Number(curr.sold_price), 0) || 0;
      
      // Margen Real Promedio (Sobre ventas concluidas)
      const totalNetMargin = soldData?.reduce((acc, curr) => {
        const expenses = soldExpensesMap[curr.vehicle_id] || 0;
        const totalCost = Number(curr.vehicles?.take_price || 0) + expenses;
        return acc + (Number(curr.sold_price) - totalCost);
      }, 0) || 0;

      const avgMarginPercent = totalSales > 0 ? (totalNetMargin / totalSales) * 100 : 0;

      setStats({
        totalStock,
        totalTakePrice,
        totalPotentialPrice,
        totalDifference,
        totalSales,
        avgMargin: avgMarginPercent
      });

      // --- GRÁFICOS ---
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const last6Months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return months[d.getMonth()];
      });

      const salesByMonth = last6Months.map(m => ({ name: m, Ventas: 0, Margen: 0 }));
      soldData?.forEach(s => {
        const date = new Date(s.sold_at);
        const monthLabel = months[date.getMonth()];
        const bucket = salesByMonth.find(b => b.name === monthLabel);
        if (bucket) {
          const expenses = soldExpensesMap[s.vehicle_id] || 0;
          bucket.Ventas += Number(s.sold_price);
          bucket.Margen += (Number(s.sold_price) - (Number(s.vehicles?.take_price || 0) + expenses));
        }
      });
      setSalesHistory(salesByMonth);

      const recentSalesMargins = soldData?.slice(-8).map(s => {
        const expenses = soldExpensesMap[s.vehicle_id] || 0;
        const margin = Number(s.sold_price) - (Number(s.vehicles?.take_price || 0) + expenses);
        const name = `${s.vehicles?.catalog_brands?.name} ${s.vehicles?.catalog_models?.name}`;
        return { name, margin };
      }) || [];
      setMarginData(recentSalesMargins);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-black tracking-tight uppercase text-xs italic">Calculando Patrimonio Real...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Consolidado de Stock</h2>
          <p className="text-slate-500 font-medium text-lg">Valuación de activos y margen proyectado</p>
        </div>
        <div className="flex gap-3">
           <Link to="/inventory" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1">
             <Car size={18} /> Ver Stock
           </Link>
           <Link to="/vehicles/new" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-1">
             <PlusCircle size={18} /> Nueva Toma
           </Link>
        </div>
      </div>

      {/* METRICAS PRINCIPALES (RE-DISEÑADAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* UNIDADES */}
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unidades en Stock</p>
          <div className="flex items-end justify-between">
            <h3 className="text-6xl font-black text-slate-900 leading-none">{stats.totalStock}</h3>
            <div className="p-4 bg-slate-50 text-slate-400 rounded-3xl group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
              <Car size={32} />
            </div>
          </div>
        </div>

        {/* CAPITAL ACTIVO (TOMA) */}
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group ring-4 ring-transparent hover:ring-blue-50">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Capital Activo (Toma)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-blue-900 font-mono tracking-tighter leading-none tabular-nums">{formatCurrency(stats.totalTakePrice)}</h3>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Wallet size={28} />
            </div>
          </div>
        </div>

        {/* CAPITAL POTENCIAL (LISTA) */}
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group ring-4 ring-transparent hover:ring-emerald-50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Cap. Potencial (Al Público)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-emerald-900 font-mono tracking-tighter leading-none tabular-nums">{formatCurrency(stats.totalPotentialPrice)}</h3>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <Coins size={28} />
            </div>
          </div>
        </div>

        {/* DIFERENCIA */}
        <div className="bg-slate-900 p-7 rounded-[2.5rem] shadow-2xl shadow-slate-200 group transform hover:-translate-y-1 transition-all duration-300">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Diferencia Proyectada</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-white font-mono tracking-tighter leading-none tabular-nums">+{formatCurrency(stats.totalDifference)}</h3>
            <div className="p-4 bg-white/10 text-emerald-400 rounded-3xl group-hover:bg-emerald-400 group-hover:text-slate-900 transition-all duration-300">
              <ArrowUpRight size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* GRAFICOS SECUNDARIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* EVOLUCION */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Histórico de Ventas</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Facturación vs Margen Neto</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600 rounded-full" /><span className="text-[9px] font-black uppercase text-slate-400">Ventas</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full" /><span className="text-[9px] font-black uppercase text-slate-400">Margen</span></div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesHistory}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px'}}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Area type="monotone" dataKey="Ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={4} />
                <Area type="monotone" dataKey="Margen" stroke="#10b981" fillOpacity={0} strokeWidth={4} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKING */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="mb-10">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rendimiento por Unidad</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Margen Neto de últimas ventas concluidas</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: '#64748b', fontSize: 9, fontWeight: 'black'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [formatCurrency(Number(value)), 'Margen Real']}
                />
                <Bar dataKey="margin" fill="#0f172a" radius={[0, 10, 10, 0]} barSize={16}>
                  {marginData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin > 1500000 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FOOTER DASHBOARD */}
      <div className="bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <TrendingUp size={32} />
            </div>
            <div>
              <h4 className="text-2xl font-black uppercase tracking-tight leading-none">Rentabilidad Operativa</h4>
              <p className="text-blue-100 font-medium text-sm mt-2 opacity-80">Rendimiento neto promedio sobre capital recuperado.</p>
            </div>
         </div>
         <div className="text-right">
            <h3 className="text-5xl font-black font-mono leading-none tracking-tighter">{formatPercent(stats.avgMargin)}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mt-2">Retorno Real sobre Ventas</p>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
