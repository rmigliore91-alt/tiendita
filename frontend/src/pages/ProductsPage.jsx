import { useEffect, useState, useCallback, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ProductDetails from '../components/ui/ProductDetails';
import useRefreshOnFocus from '../hooks/useRefreshOnFocus';
import { formatPYG } from '../utils/formatters';

// Suggested names for product characteristics (free text is also allowed)
const DETAIL_SUGGESTIONS = [
  'Talle', 'Marca', 'Presentación', 'Unidades por paquete', 'Color',
  'Sabor', 'Tamaño', 'Material', 'Peso', 'Absorción',
];

// ─── SortableHeader ────────────────────────────────────────────────────────
function SortableHeader({ label, field, sortBy, sortOrder, onSort, className = '' }) {
  const active = sortBy === field;
  return (
    <th
      className={`cursor-pointer select-none group ${className}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 transition-colors duration-100 ${
        active ? 'text-primary-container' : 'text-on-surface-variant group-hover:text-on-surface'
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
  if (current === 0) return 'text-error font-bold';
  if (current <= minimum) return 'text-on-warning-container font-semibold';
  return 'text-tertiary font-semibold';
}

function priceDisplay(price) {
  if (!price || price === 0) return <span className="text-on-surface-variant italic text-xs">Consultar</span>;
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
    return { label: 'VENCIDO', className: 'bg-error-container text-error border border-error-outline', icon: 'bg-error-dot' };
  }
  if (days <= 7) {
    return { label: `Vence en ${days}d`, className: 'bg-caution-container text-on-caution-container border border-caution-outline', icon: 'bg-caution' };
  }
  if (days <= 30) {
    return { label: `Vence en ${days}d`, className: 'bg-warning-container text-on-warning-container border border-warning-outline', icon: 'bg-warning' };
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
  description: '',
  details: [],
};

const PAGE_SIZE = 20;

// ─── component ─────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { isAdmin, isMarketing } = useAuth();
  // Admin and marketing can edit products; only admin creates / (de)activates
  const canEdit = isAdmin || isMarketing;

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
  const load = useCallback(async (silent = false) => {
    if (silent !== true) setLoading(true);
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
  // Stock can change from other tabs / users: refresh when coming back
  useRefreshOnFocus(() => load(true));

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
      description: product.description || '',
      details: Array.isArray(product.details) ? product.details.map((d) => ({ ...d })) : [],
    });
    setFormError('');
    setModalOpen(true);
  }

  // ── characteristics (details) helpers ───────────────────────────────────
  function addDetail() {
    setForm((p) => ({ ...p, details: [...p.details, { label: '', value: '' }] }));
  }
  function updateDetail(idx, field, value) {
    setForm((p) => ({
      ...p,
      details: p.details.map((d, i) => (i === idx ? { ...d, [field]: value } : d)),
    }));
  }
  function removeDetail(idx) {
    setForm((p) => ({ ...p, details: p.details.filter((_, i) => i !== idx) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        // Stock is never sent on edit: it only changes through movements
        const { stock_current, ...data } = form; // eslint-disable-line no-unused-vars
        await client.put(`/products/${editing.id}`, data);
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
          <h2 className="page-title">Productos</h2>
          {!loading && (
            <p className="text-sm text-on-surface-variant mt-0.5">{total} producto{total !== 1 ? 's' : ''} en total</p>
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              id="product-search"
              className="form-input pl-9"
              placeholder="Buscar por nombre, SKU o característica (ej. talle M)…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                aria-label="Limpiar búsqueda"
              >
                <span className="material-symbol text-[18px]" aria-hidden="true">close</span>
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
        <div className="p-3 rounded-lg bg-error-container border border-error-outline text-sm text-error">{error}</div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
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
                  {canEdit && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="text-center py-14 text-on-surface-variant">
                      <span className="material-symbol text-[36px] text-outline block mb-2" aria-hidden="true">search_off</span>
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
                          <span className="font-mono text-xs text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded whitespace-nowrap">
                            {p.sku}
                          </span>
                        </td>

                        {/* Name */}
                        <td>
                          <div className="min-w-[10rem] max-w-xs">
                            <button
                              type="button"
                              onClick={canEdit ? () => openEdit(p) : undefined}
                              className={`font-medium text-on-surface text-sm leading-tight text-left ${canEdit ? 'hover:text-primary-container hover:underline' : 'cursor-default'}`}
                              title={canEdit ? 'Editar producto' : undefined}
                            >
                              {p.name}
                            </button>
                            {p.description && (
                              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{p.description}</p>
                            )}
                            <ProductDetails details={p.details} className="mt-1" />
                          </div>
                        </td>

                        {/* Category */}
                        <td className="text-on-surface-variant text-xs whitespace-nowrap">{p.category_name}</td>

                        {/* Unit */}
                        <td className="text-on-surface-variant text-xs">{p.unit}</td>

                        {/* Stock current — colored */}
                        <td className={`text-right text-sm tabular-nums ${stockColor(p.stock_current, p.stock_minimum)}`}>
                          {p.stock_current}
                        </td>

                        {/* Stock minimum */}
                        <td className="text-right text-on-surface-variant text-sm tabular-nums">{p.stock_minimum}</td>

                        {/* Sale price */}
                        <td className="text-right text-sm text-on-surface whitespace-nowrap">
                          {priceDisplay(p.sale_price)}
                        </td>

                        {/* Expiry date */}
                        <td className="text-center">
                          {p.expiry_date ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-on-surface-variant">
                                {formatExpiryDate(p.expiry_date)}
                              </span>
                              {badge && (
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${badge.icon}`} />{badge.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-outline text-xs">—</span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="text-center">
                          <span className={p.active ? 'badge badge-green' : 'badge badge-slate'}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-success' : 'bg-surface-container-high'}`} />
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Actions — edit: admin + marketing · (de)activate: admin */}
                        {canEdit && (
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1.5 rounded-lg hover:bg-primary-fixed text-primary-container transition-colors"
                                title="Editar producto"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {isAdmin && (
                              <button
                                onClick={() => toggleActive(p)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  p.active
                                    ? 'hover:bg-error-container text-error'
                                    : 'hover:bg-tertiary-fixed text-tertiary'
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
                              )}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-surface-container-high text-sm text-on-surface-variant">
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
                <span className="text-xs text-on-surface-variant">
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
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Categoría *</label>
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
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Nombre *</label>
              <input type="text" className="form-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required placeholder="Ej. Pañal Adulto Tena M" />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">SKU *</label>
              <input type="text" className="form-input font-mono"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                required placeholder="Ej. HIG-001" />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Unidad *</label>
              <input type="text" className="form-input"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                required placeholder="Ej. paquete, lata, unidad" />
            </div>

            {/* Stock initial (create only) */}
            {!editing && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Stock Inicial</label>
                <input type="number" min="0" className="form-input"
                  value={form.stock_current}
                  onChange={(e) => setForm((p) => ({ ...p, stock_current: e.target.value }))} />
              </div>
            )}

            {/* Stock current (edit: read only) */}
            {editing && (
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Stock Actual</label>
                <div className="form-input bg-surface-container-low text-on-surface-variant flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{editing.stock_current} {editing.unit}</span>
                  <span className="text-[11px]">Se modifica con movimientos</span>
                </div>
              </div>
            )}

            {/* Stock minimum */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Stock Mínimo</label>
              <input type="number" min="0" className="form-input"
                value={form.stock_minimum}
                onChange={(e) => setForm((p) => ({ ...p, stock_minimum: e.target.value }))} />
            </div>

            {/* Cost price */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Precio Costo (₲)</label>
              <input type="number" min="0" className="form-input"
                value={form.cost_price}
                onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} />
            </div>

            {/* Sale price */}
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Precio Venta (₲)</label>
              <input type="number" min="0" className="form-input"
                value={form.sale_price}
                onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))} />
            </div>

            {/* Expiry date */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                <span className="material-symbol text-[16px] align-[-3px] text-outline" aria-hidden="true">event</span> Fecha de vencimiento
                <span className="text-outline font-normal">(opcional)</span>
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
                  <p className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${badge.className.includes('error') ? 'text-error' : badge.className.includes('caution') ? 'text-on-caution-container' : 'text-on-warning-container'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.icon}`} />{badge.label === 'VENCIDO' ? 'Esta fecha ya venció' : `Alerta: ${badge.label}`}
                  </p>
                ) : null;
              })()}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                Descripción <span className="text-outline font-normal">(opcional)</span>
              </label>
              <textarea
                className="form-input resize-none"
                rows={2}
                id="product-description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ej. Pañal descartable para adultos, uso nocturno"
              />
            </div>

            {/* Characteristics */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbol text-[16px] align-[-3px] text-outline" aria-hidden="true">tune</span>
                  Características <span className="text-outline font-normal">(talle, marca, presentación…)</span>
                </label>
                <button type="button" onClick={addDetail} className="btn-secondary py-1 px-2.5 text-xs" id="btn-add-detail">
                  + Agregar
                </button>
              </div>
              <datalist id="detail-suggestions">
                {DETAIL_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
              </datalist>
              {form.details.length === 0 ? (
                <p className="text-xs text-outline">Sin características. Ej.: Talle → M · Unidades por paquete → 20</p>
              ) : (
                form.details.map((d, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                    <input
                      type="text"
                      className="form-input"
                      list="detail-suggestions"
                      placeholder="Nombre (ej. Talle)"
                      value={d.label}
                      maxLength={60}
                      onChange={(e) => updateDetail(idx, 'label', e.target.value)}
                      aria-label={`Nombre de la característica ${idx + 1}`}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Valor (ej. M)"
                      value={d.value}
                      maxLength={200}
                      onChange={(e) => updateDetail(idx, 'value', e.target.value)}
                      aria-label={`Valor de la característica ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeDetail(idx)}
                      className="p-2 rounded-lg hover:bg-error-container text-error transition-colors"
                      title="Quitar característica"
                    >
                      <span className="material-symbol text-[18px]" aria-hidden="true">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-error-container border border-error-outline text-sm text-error">
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
