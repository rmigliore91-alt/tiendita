import { useEffect, useState, useCallback, useRef } from 'react';
import client from '../api/client';
import Pagination from '../components/ui/Pagination';
import { formatPYG, formatDateTime } from '../utils/formatters';

/* ─── Product search combobox for filters ────────────────────── */
function ProductSearchFilter({ products, value, onChange }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const [label, setLabel]   = useState('');
  const wrapRef             = useRef(null);

  // Sync label when value is reset externally
  useEffect(() => {
    if (!value) { setQuery(''); setLabel(''); }
  }, [value]);

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15)
    : products.slice(0, 15);

  function pick(p) {
    setQuery('');
    setLabel(`[${p.sku}] ${p.name}`);
    onChange(String(p.id));
    setOpen(false);
  }

  function clear() {
    setQuery('');
    setLabel('');
    onChange('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      {label ? (
        // Selected state — show chip
        <div className="flex items-center gap-2 form-input py-2 pr-2">
          <span className="flex-1 text-sm text-slate-200 truncate">{label}</span>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            title="Limpiar filtro"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        // Search input state
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="form-input pl-9"
            placeholder="Buscar producto…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            id="hist-filter-product-search"
            autoComplete="off"
          />
        </div>
      )}

      {open && !label && (
        <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => pick(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-500">{p.sku}</p>
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">Sin resultados para "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Quick filter chip ──────────────────────────────────────── */
function FilterChip({ label, active, onClick, colorClass = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? `${colorClass || 'border-brand-500 bg-brand-500/15 text-brand-400'}`
          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Main HistoryPage ───────────────────────────────────────── */
export default function HistoryPage() {
  const [data, setData]           = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [categories, setCategories] = useState([]);
  const [products, setProducts]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [filters, setFilters] = useState({
    product_id:  '',
    category_id: '',
    type:        '',
    sale_type:   '',
    user_id:     '',
    date_from:   '',
    date_to:     '',
  });
  const [page, setPage] = useState(1);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 50 });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return params;
  }, [filters, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movRes, catRes, prodRes, userRes] = await Promise.all([
        client.get(`/movements?${buildParams()}`),
        categories.length ? Promise.resolve({ data: categories }) : client.get('/categories'),
        products.length   ? Promise.resolve({ data: { data: products } }) : client.get('/products?page=1&limit=500'),
        users.length      ? Promise.resolve({ data: users }) : client.get('/users').catch(() => ({ data: [] })),
      ]);
      setData(movRes.data.data);
      setPagination(movRes.data.pagination);
      setCategories(catRes.data);
      setProducts(prodRes.data.data ?? prodRes.data);
      setUsers(userRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [buildParams]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  function handleFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await client.get(`/movements/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'movimientos.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setFilters({ product_id: '', category_id: '', type: '', sale_type: '', user_id: '', date_from: '', date_to: '' });
    setPage(1);
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Historial de Movimientos</h2>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-semibold">
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-secondary"
            id="btn-toggle-filters"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filtros {filtersOpen ? '▲' : '▼'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary"
            id="btn-export-csv"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* ── Filters panel ── */}
      {filtersOpen && (
        <div className="card p-4 space-y-4">
          {/* Quick chips row: type + sale_type */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Todos"
                active={!filters.type}
                onClick={() => handleFilter('type', '')}
              />
              <FilterChip
                label="↑ ENTRADA"
                active={filters.type === 'ENTRADA'}
                onClick={() => handleFilter('type', filters.type === 'ENTRADA' ? '' : 'ENTRADA')}
                colorClass="border-emerald-500 bg-emerald-500/15 text-emerald-400"
              />
              <FilterChip
                label="↓ SALIDA"
                active={filters.type === 'SALIDA'}
                onClick={() => handleFilter('type', filters.type === 'SALIDA' ? '' : 'SALIDA')}
                colorClass="border-red-500 bg-red-500/15 text-red-400"
              />
            </div>
          </div>

          {/* Sale type chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Destino</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="Todos"
                active={!filters.sale_type}
                onClick={() => handleFilter('sale_type', '')}
              />
              <FilterChip
                label="🏠 Interna"
                active={filters.sale_type === 'interna'}
                onClick={() => handleFilter('sale_type', filters.sale_type === 'interna' ? '' : 'interna')}
                colorClass="border-violet-500 bg-violet-500/15 text-violet-300"
              />
              <FilterChip
                label="🌐 Externa"
                active={filters.sale_type === 'externa'}
                onClick={() => handleFilter('sale_type', filters.sale_type === 'externa' ? '' : 'externa')}
                colorClass="border-amber-500 bg-amber-500/15 text-amber-300"
              />
            </div>
          </div>

          {/* Search row: product, category, user */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Producto</label>
              <ProductSearchFilter
                products={products}
                value={filters.product_id}
                onChange={(v) => handleFilter('product_id', v)}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Categoría</label>
              <select
                className="form-input"
                value={filters.category_id}
                onChange={(e) => handleFilter('category_id', e.target.value)}
                id="hist-filter-category"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Usuario</label>
              <select
                className="form-input"
                value={filters.user_id}
                onChange={(e) => handleFilter('user_id', e.target.value)}
                id="hist-filter-user"
              >
                <option value="">Todos los usuarios</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Fecha desde</label>
              <input
                type="date"
                className="form-input"
                value={filters.date_from}
                onChange={(e) => handleFilter('date_from', e.target.value)}
                id="hist-filter-date-from"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Fecha hasta</label>
              <input
                type="date"
                className="form-input"
                value={filters.date_to}
                onChange={(e) => handleFilter('date_to', e.target.value)}
                id="hist-filter-date-to"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button onClick={clearFilters} className="btn-secondary text-xs py-1.5">
                ✕ Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Results summary ── */}
      {!loading && (
        <p className="text-xs text-slate-500">
          {pagination.total === 0
            ? 'Sin resultados'
            : `${pagination.total} movimiento${pagination.total !== 1 ? 's' : ''} encontrado${pagination.total !== 1 ? 's' : ''}`}
          {activeFilterCount > 0 && ' · con filtros aplicados'}
        </p>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Tipo</th>
                  <th className="text-center">Destino</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">P. Unitario</th>
                  <th className="text-right">Total</th>
                  <th>Usuario</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>No se encontraron movimientos{activeFilterCount > 0 ? ' con los filtros aplicados' : ''}</span>
                        {activeFilterCount > 0 && (
                          <button onClick={clearFilters} className="btn-secondary text-xs py-1.5">
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((m) => (
                    <tr key={m.id}>
                      <td className="text-slate-400 text-xs whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                      <td>
                        <p className="text-slate-200 text-sm font-medium">{m.product_name}</p>
                        <p className="text-slate-500 text-xs">{m.sku}</p>
                      </td>
                      <td className="text-slate-400 text-xs">{m.category_name}</td>
                      <td className="text-center">
                        <span className={`badge text-xs font-bold ${
                          m.type === 'ENTRADA' ? 'badge-green' : 'badge-red'
                        }`}>
                          {m.type === 'ENTRADA' ? '↑' : '↓'} {m.type}
                        </span>
                      </td>
                      <td className="text-center">
                        {m.type === 'SALIDA' && m.sale_type ? (
                          <span className={`badge text-xs ${
                            m.sale_type === 'interna'
                              ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {m.sale_type === 'interna' ? '🏠 Interna' : '🌐 Externa'}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right font-semibold text-slate-200">{m.quantity}</td>
                      <td className="text-right text-slate-300 text-sm">{formatPYG(m.unit_price)}</td>
                      <td className="text-right text-slate-200 font-semibold text-sm">{formatPYG(m.total_price)}</td>
                      <td className="text-slate-400 text-xs">{m.user_name}</td>
                      <td className="text-slate-500 text-xs max-w-32 truncate" title={m.notes}>{m.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4">
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
