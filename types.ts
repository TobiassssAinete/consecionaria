
export type VehicleStatus = 'in_stock' | 'reserved' | 'sold';
export type DocStatus = 'missing' | 'in_progress' | 'ok';

export interface CatalogItem {
  id: string;
  name: string;
  is_active: boolean;
  needs_review: boolean;
  created_at: string;
}

export interface DocType extends CatalogItem {
  is_critical: boolean;
}

export interface ModelItem extends CatalogItem {
  brand_id: string;
}

export interface TrimItem extends CatalogItem {
  model_id: string;
}

export interface Vehicle {
  id: string;
  brand_id: string;
  model_id: string;
  trim_id: string;
  fuel_id: string;
  transmission_id: string;
  color_id: string;
  year: number;
  mileage: number;
  plate: string;
  take_price: number;
  info_price?: number;
  zero_km_price?: number;
  suggested_price?: number;
  list_price?: number;
  status: VehicleStatus;
  entry_date: string; // Fecha de toma manual
  sold_at?: string;
  sold_price?: number;
  created_at: string;
  updated_at: string;
  image_urls?: string[];
  
  // Joined fields
  catalog_brands?: { name: string };
  catalog_models?: { name: string };
  catalog_trims?: { name: string };
  catalog_fuels?: { name: string };
  catalog_transmissions?: { name: string };
  catalog_colors?: { name: string };
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  doc_type_id: string;
  status: DocStatus;
  file_url?: string;
  catalog_doc_types: DocType;
}

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  expense_type_id: string;
  amount: number;
  expense_date: string;
  notes?: string;
  catalog_expense_types: { name: string };
}

export interface Sale {
  id: string;
  vehicle_id: string;
  sold_price: number;
  sold_at: string;
  notes?: string;
  vehicles: Vehicle;
}

export interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before: any;
  after: any;
  user_id: string;
  created_at: string;
}
