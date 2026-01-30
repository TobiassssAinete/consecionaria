
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  PlusCircle, 
  History, 
  BookOpen, 
  DollarSign, 
  FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventory', icon: Car, label: 'Inventario' },
    { to: '/vehicles/new', icon: PlusCircle, label: 'Cargar Vehículo' },
    { to: '/sales', icon: DollarSign, label: 'Ventas' },
    { to: '/catalogs', icon: BookOpen, label: 'Catálogos' },
    { to: '/audit', icon: History, label: 'Historial' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-20 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Car className="text-white w-5 h-5" />
          </div>
          <span className="text-white text-lg font-bold">CONCESIONARIA</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
              isActive 
                ? "bg-blue-600 text-white" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">v1.0.0 – Internal Tool</p>
      </div>
    </div>
  );
};

export default Sidebar;
