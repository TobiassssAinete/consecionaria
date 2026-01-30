
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Car, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  PlusCircle, 
  ArrowRight,
  BarChart3,
  PieChart as PieIcon
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/utils';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalInvested: 0,
    totalSales: 0,
    pendingDocs: 0,
    avgMargin: 0
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [brandData, setBrandData] = useState<any[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: stockData } = await supabase.from('vehicles').select('id, take_price, list_price, catalog_brands(name)').eq('status', 'in_stock');
      const { data: soldData } = await supabase.from('sales').select('vehicle_id, sold_price, sold_at, vehicles(take_price, catalog_brands(name), catalog_models(name))');
      const { count: pendingDocsCount } = await supabase
        .from('vehicle_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'missing');

      // Obtener gastos de unidades en stock para capital total invertido
      const stockIds = stockData?.map(v => v.id) || [];
      const { data: stockExpenses } = await supabase.from('vehicle_expenses').select('amount').in('vehicle_id', stockIds);
      const totalStockExpenses = stockExpenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // Obtener gastos de unidades vendidas para margen real
      const soldIds = soldData?.map(s => s.vehicle_id) || [];
      const { data: soldExpenses } = await supabase.from('vehicle_expenses').select('vehicle_id, amount').in('vehicle_id', soldIds);
      
      const soldExpensesMap: Record<string, number> = {};
      soldExpenses?.forEach(e => {
        soldExpensesMap[e.vehicle_id] = (soldExpensesMap[e.vehicle_id] || 0) + Number(e.amount);
      });

      // Calcular estadísticas
      const totalStock = stockData?.length || 0;
      const totalInvestedInStock = (stockData?.reduce((acc, curr) => acc + Number(curr.take_price), 0) || 0) + totalStockExpenses;
      const totalSales = soldData?.reduce((acc, curr) => acc + Number(curr.sold_price), 0) || 0;
      
      const totalNetMargin = soldData?.reduce((acc, curr) => {
        const expenses = soldExpensesMap[curr.vehicle_id] || 0;
        const totalCost = Number(curr.vehicles?.take_price || 0) + expenses;
        return acc + (Number(curr.sold_price) - totalCost);
      }, 0) || 0;

      const avgMarginPercent = totalSales > 0 ? (totalNetMargin / totalSales) * 100 : 0;

      setStats({
        totalStock,
        totalInvested: totalInvestedInStock,
        totalSales,
        pendingDocs: pendingDocsCount || 0,
        avgMargin: avgMarginPercent
      });

      // Gráfico de Marcas
      const brands: Record<string, number> = {};
      stockData?.forEach(v => {
        const name = v.catalog_brands?.name || 'Otros';
        brands[name] = (brands[name] || 0) + 1;
      });
      setBrandData(Object.entries(brands).map(([name, value]) => ({ name, value })));

      // Gráfico de Rango de Precios
      const priceRanges = [
        { name: '< $15M', min: 0, max: 15000000, count: 0 },
        { name: '$15M - $30M', min: 15000000, max: 30000000, count: 0 },
        { name: '$30M - $50M', min: 30000000, max: 50000000, count: 0 },
        { name: '> $50M', min: 50000000, max: Infinity, count: 0 },
      ];
      stockData?.forEach(v => {
        const price = Number(v.list_price || 0);
        const range = priceRanges.find(r => price >= r.min && price < r.max);
        if (range) range.count++;
      });
      setPriceData(priceRanges);

      // Historial de Ventas
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

      const recentSalesMargins = soldData?.slice(-10).map(s => {
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
        <p className="text-slate-500 font-black tracking-tight uppercase text-xs">Sincronizando Economía...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Centro de Control</h2>
          <p className="text-slate-500 font-medium text-lg">Métricas financieras con margen neto real</p>
        </div>
        <div className="flex gap-3">
           <Link to="/inventory" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1">
             <Car size={18} /> INVENTARIO
           </Link>
           <Link to="/vehicles/new" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition transform hover:-translate-y-1">
             <PlusCircle size={18} /> NUEVA TOMA
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unidades en Stock</p>
          <div className="flex items-end justify-between">
            <h3 className="text-5xl font-black text-slate-900 leading-none">{stats.totalStock}</h3>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition duration-300">
              <Car size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Capital Activo Neto</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-blue-700 font-mono tracking-tighter leading-none">{formatCurrency(stats.totalInvested)}</h3>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
              <DollarSign size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ventas Totales</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tighter leading-none">{formatCurrency(stats.totalSales)}</h3>
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition duration-300">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ROI Real Promedio</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black text-emerald-600 leading-none">{formatPercent(stats.avgMargin)}</h3>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition duration-300">
              <BarChart3 size={28} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Crecimiento Financiero</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ventas vs Margen Neto (6 meses)</p>
            </div>
          </div>
          <div className="h-[350px]">
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

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="mb-10">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ranking de Unidades</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Margen Neto Real por Unidad Vendida</p>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'black'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [formatCurrency(Number(value)), 'Margen Real']}
                />
                <Bar dataKey="margin" fill="#0f172a" radius={[0, 10, 10, 0]} barSize={20}>
                  {marginData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.margin > 1500000 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
