/**
 * Format a number as PYG Guaraníes: ₲ 125.000
 * Uses period as thousands separator (Paraguayan convention).
 */
export function formatPYG(amount) {
  if (amount == null || isNaN(amount)) return '₲ 0';
  return (
    '₲ ' +
    Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

/**
 * Format a Date or ISO string to local date: 26/06/2025
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a Date or ISO string to local datetime: 26/06/2025 14:30
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return stock status info based on current vs minimum stock.
 */
export function stockStatus(current, minimum) {
  if (current === 0) return { label: 'Sin stock', className: 'badge-red', dot: 'bg-red-400' };
  if (current <= minimum) return { label: 'Stock bajo', className: 'badge-yellow', dot: 'bg-amber-400' };
  return { label: 'Stock OK', className: 'badge-green', dot: 'bg-emerald-400' };
}

/**
 * Truncate text to maxLen characters.
 */
export function truncate(text, maxLen = 40) {
  if (!text) return '—';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}
