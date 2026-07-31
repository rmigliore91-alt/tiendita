import { useEffect, useState, useCallback, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { formatPYG } from '../utils/formatters';

// ─── SortableHeader ────────────────────────────────────────────────────────
function SortableHeader({ label, field, sortBy, sortOrder, onSort, className = '' }) {
  const active = sortBy === field;
  return (
    <th
      className={`cursor-pointer select-none group ${className}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 transition-colors duration-100 ${
        active ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
      }`}>
        {label}
        <span className={`text-xs transition-opacity duration-100 ${
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        }`}>
          {active && sortOrder === 'desc' ? '▼' : '▲'}
        </span>
      </span>
    </th>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────

function stockColor(current, minimum) {
  if (current === 0) return 'text-red-400 font-bold';
  if (current <= minimum) return 'text-amber-400 font-semibold';
  return 'text-emerald-400 font-semibold';
}

function priceDisplay(price) {
  if (!price || price === 0) return <span className="text-slate-500 italic text-xs">Consultar</span>;
  return formatPYG(price);
}

/**
 * Returns expiry badge info based on days until expiry.
 * days < 0  → expired (rojo)
 * 0–7       → muy próximo (naranja intenso)
 * 8–30      → próximo (amarillo)
 * null / >30 → sin alerta
 */
function expiryBadge(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffMs = exp - today;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { label: 'VENCIDO', className: 'bg-red-500/20 text-red-300 border border-red-500/40', icon: '🔴' };
  }
  if (days <= 7) {
    return { label: `Vence en ${days}d`, className: 'bg-orange-500/20 text-orange-300 border border-orange-500/40', icon: '🟠' };
  }
  if (days <= 30) {
    return { label: `Vence en ${days}d`, className: 'bg-amber-500/20 text-amber-300 border border-amber-500/40', icon: '🟡' };
  }
  return null; // no alert needed
}

function formatExpiryDate(expiryDate) {
  if (!expiryDate) return null;
  return new Date(expiryDate + 'T00:00:00').toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

const EMPTY_FORM = {
  category_id: '',
  name: '',
  sku: '',
  unit: 'unidad',
  stock_current: 0,
  stock_minimum: 5,
  cost_price: 0,
  sale_price: 0,
  expiry_date: '',
};

const PAGE_SIZE = 20;

// ─── component ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { isAdmin } = useAuth();

  // Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchInput, setSearchInput] = useState('');   // raw input
  const [search, setSearch] = useState('');              // debounced
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  // Sorting
  const [sortBy, setSortBy] = useState(null);       // field key or null
  const [sortOrder, setSortOrder] = useState('asc');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── debounce search input 300 ms ──────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  // ── fetch products ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE });
      if (search)     params.set('search', search);
      if (categoryId) params.set('category_id', categoryId);
      if (sortBy)     params.set('sort_by', sortBy);
      if (sortBy)     params.set('order', sortOrder);

      const [prodRes, catRes] = await Promise.all([
        client.get(`/products?${params}`),
        categories.length ? Promise.resolve({ data: categories }) : client.get('/categories'),
      ]);

      setProducts(prodRes.data.data);
      setTotal(prodRes.data.total);
      setTotalPages(prodRes.data.totalPages);
      setCategories(catRes.data);
    } catch (e) {
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── sort handler ──────────────────────────────────────────────────────────
  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  }

  // ── filter helpers ────────────────────────────────────────────────────────
  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setSortBy(null);
    setSortOrder('asc');
    setPage(1);
  }

  // ── modal helpers ─────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      category_id: product.category_id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      stock_current: product.stock_current,
      stock_minimum: product.stock_minimum,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await client.put(`/products/${editing.id}`, form);
      } else {
        await client.post('/products', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product) {
    const action = product.active ? 'deactivate' : 'activate';
    const label = product.active ? 'desactivar' : 'activar';
    if (!confirm(`¿Desea ${label} el producto "${product.name}"?`)) return;
    try {
      await client.patch(`/products/${product.id}/${action}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar');
    }
  }

  // ── pagination helpers ────────────────────────────────────────────────────
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total);
  const to   = Math.min(page * PAGE_SIZE, total);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-[100rem] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Productos</h2>
          {!loading && (
            <p className="text-sm text-slate-500 mt-0.5">{total} producto{total !== 1 ? 's' : ''} en total</p>
          )}
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary" id="btn-new-product">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              id="product-search"
              className="form-input pl-9"
              placeholder="Buscar por nombre o SKU…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            id="product-filter-category"
            className="form-input sm:w-64"
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Clear */}
          <button
            onClick={clearFilters}
            className="btn-secondary whitespace-nowrap"
            id="btn-clear-filters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>
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
                  <SortableHeader label="SKU"           field="sku"           sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Nombre"        field="name"          sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Categoría"     field="category_name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Unidad"        field="unit"          sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Stock Actual"  field="stock_current" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right" />
                  <SortableHeader label="Stock Mín."    field="stock_minimum" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right" />
                  <SortableHeader label="Precio Venta (₲)" field="sale_price" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right" />
                  <SortableHeader label="Vencimiento"   field="expiry_date"   sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center" />
                  <SortableHeader label="Estado"        field="active"        sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center" />
                  {isAdmin && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="text-center py-14 text-slate-500">
                      <span className="text-3xl block mb-2">🔍</span>
                      No se encontraron productos con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const badge = expiryBadge(p.expiry_date);
                    return (
                      <tr key={p.id} className={!p.active ? 'opacity-40' : ''}>
                        {/* SKU */}
                        <td>
                          <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {p.sku}
                          </span>
                        </td>

                        {/* Name */}
                        <td>
                          <p className="font-medium text-slate-200 text-sm leading-tight max-w-xs">{p.name}</p>
                        </td>

                        {/* Category */}
                        <td className="text-slate-400 text-xs whitespace-nowrap">{p.category_name}</td>

                        {/* Unit */}
                        <td className="text-slate-400 text-xs">{p.unit}</td>

                        {/* Stock current — colored */}
                        <td className={`text-right text-sm tabular-nums ${stockColor(p.stock_current, p.stock_minimum)}`}>
                          {p.stock_current}
                        </td>

                        {/* Stock minimum */}
                        <td className="text-right text-slate-500 text-sm tabular-nums">{p.stock_minimum}</td>

                        {/* Sale price */}
                        <td className="text-right text-sm text-slate-300 whitespace-nowrap">
                          {priceDisplay(p.sale_price)}
                        </td>

                        {/* Expiry date */}
                        <td className="text-center">
                          {p.expiry_date ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-slate-400">
                                {formatExpiryDate(p.expiry_date)}
                              </span>
                              {badge && (
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                                  {badge.icon} {badge.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="text-center">
                          <span className={p.active ? 'badge badge-green' : 'badge badge-slate'}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Actions — admin only */}
                        {isAdmin && (
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1.5 rounded-lg hover:bg-brand-500/20 text-brand-400 transition-colors"
                                title="Editar producto"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => toggleActive(p)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  p.active
                                    ? 'hover:bg-red-500/20 text-red-400'
                                    : 'hover:bg-emerald-500/20 text-emerald-400'
                                }`}
                                title={p.active ? 'Desactivar' : 'Activar'}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  {p.active ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  )}
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 text-sm text-slate-400">
              <span>
                Mostrando {from}–{to} de {total} resultado{total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  id="btn-prev-page"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
                  id="btn-next-page"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4" id="product-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoría *</label>
              <select
                className="form-input"
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar categoría…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre *</label>
              <input type="text" className="form-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required placeholder="Ej. Pañal Adulto Tena M" />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">SKU *</label>
              <input type="text" className="form-input font-mono"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                required placeholder="Ej. HIG-001" />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Unidad *</label>
              <input type="text" className="form-input"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                required placeholder="Ej. paquete, lata, unidad" />
            </div>

            {/* Stock initial (create only) */}
            {!editing && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock Inicial</label>
                <input type="number" min="0" className="form-input"
                  value={form.stock_current}
                  onChange={(e) => setForm((p) => ({ ...p, stock_current: e.target.value }))} />
              </div>
            )}

            {/* Stock minimum */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Stock Mínimo</label>
              <input type="number" min="0" className="form-input"
                value={form.stock_minimum}
                onChange={(e) => setForm((p) => ({ ...p, stock_minimum: e.target.value }))} />
            </div>

            {/* Cost price */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio Costo (₲)</label>
              <input type="number" min="0" className="form-input"
                value={form.cost_price}
                onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} />
            </div>

            {/* Sale price */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio Venta (₲)</label>
              <input type="number" min="0" className="form-input"
                value={form.sale_price}
                onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))} />
            </div>

            {/* Expiry date */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                📅 Fecha de Vencimiento
                <span className="text-slate-600 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                id="product-expiry-date"
                value={form.expiry_date}
                onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
              />
              {form.expiry_date && (() => {
                const badge = expiryBadge(form.expiry_date);
                return badge ? (
                  <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${badge.className.includes('red') ? 'text-red-400' : badge.className.includes('orange') ? 'text-orange-400' : 'text-amber-400'}`}>
                    {badge.icon} {badge.label === 'VENCIDO' ? 'Esta fecha ya venció' : `Alerta: ${badge.label}`}
                  </p>
                ) : null;
              })()}
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary" id="btn-save-product">
              {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
