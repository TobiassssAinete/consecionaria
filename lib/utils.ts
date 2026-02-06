
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea montos de dinero para máxima legibilidad.
 */
export function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return '-';
  
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(amount).replace('ARS', '$').trim();
}

/**
 * Formatea un número con separadores de miles para uso en inputs.
 */
export function formatNumberForInput(value: number | string): string {
  const num = typeof value === 'string' ? value.replace(/\D/g, '') : value.toString();
  if (!num) return '';
  return parseInt(num).toLocaleString('es-AR');
}

/**
 * Limpia un string de moneda para obtener solo el número.
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/\D/g, '');
  return cleaned ? parseInt(cleaned) : 0;
}

/**
 * Formatea porcentajes con un decimal.
 */
export function formatPercent(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr: string | undefined | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('es-AR');
}
