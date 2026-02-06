
import * as XLSX from 'xlsx';
import { Vehicle, Sale, VehicleExpense } from '../types';
import { formatCurrency, formatDate } from './utils';

export const exportVehiclesToExcel = (vehicles: Vehicle[], expensesMap?: Record<string, number>) => {
  const data = vehicles.map((v) => {
    const totalExpenses = expensesMap ? (expensesMap[v.id] || 0) : 0;
    const totalInvestment = Number(v.take_price) + totalExpenses;
    
    return {
      'Patente': v.plate,
      'Marca': v.catalog_brands?.name || '',
      'Modelo': v.catalog_models?.name || '',
      'Versión': v.catalog_trims?.name || '',
      'Año': v.year,
      'Kms': v.mileage,
      'Costo Toma': v.take_price,
      'Total Gastos': totalExpenses,
      'Inversión Total': totalInvestment,
      'Precio Lista': v.list_price || 0,
      'Estado': v.status === 'in_stock' ? 'En Stock' : v.status === 'reserved' ? 'Reservado' : 'Vendido',
      'Fecha Toma': formatDate(v.entry_date), // Usamos entry_date
      'Fecha Carga Sistema': formatDate(v.created_at),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
  XLSX.writeFile(workbook, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportSalesToExcel = (sales: Sale[], expensesMap: Record<string, number>) => {
  const data = sales.map((s) => {
    const v = s.vehicles;
    const totalExpenses = expensesMap[v.id] || 0;
    const totalInvestment = Number(v.take_price) + totalExpenses;
    const netMargin = Number(s.sold_price) - totalInvestment;
    
    return {
      'Fecha Venta': formatDate(s.sold_at),
      'Patente': v.plate,
      'Marca': v.catalog_brands?.name || '',
      'Modelo': v.catalog_models?.name || '',
      'Versión': v.catalog_trims?.name || '',
      'Precio Venta': s.sold_price,
      'Costo Toma': v.take_price,
      'Gastos Acumulados': totalExpenses,
      'Inversión Total': totalInvestment,
      'Margen Neto Real': netMargin,
      'ROI %': totalInvestment > 0 ? ((netMargin / totalInvestment) * 100).toFixed(2) + '%' : '0%',
      'Notas': s.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
  XLSX.writeFile(workbook, `Reporte_Ventas_Contable_${new Date().toISOString().split('T')[0]}.xlsx`);
};
