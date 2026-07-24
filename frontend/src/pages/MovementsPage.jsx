import { useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { formatPYG } from '../utils/formatters';

/* ─────────────────────────────────────────────────────────────
   ProductCombobox — live search instead of a plain <select>
───────────────────────────────────────────────────────────── */
function ProductCombobox({ products, selected, onSelect, placeholder = 'Buscar producto…', id }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync display when selection is cleared externally
  useEffect(() => {
    if (!selected) setQuery('');
  }, [selected]);

  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : products.slice(0, 20);

  function pick(p) {
    setQuery(`[${p.sku}] ${p.name}`);
    onSelect(p);
    setOpen(false);
  }

  function handleInput(val) {
    setQuery(val);
    onSelect(null);
    setOpen(true);
  }

  function clear() {
    setQuery('');
    onSelect(null);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          className="form-input pr-8"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && !selected && (
        <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => pick(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.sku} · Stock: {p.stock_current} {p.unit}
                </p>
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

/* ─────────────────────────────────────────────────────────────
   MovementsPage
───────────────────────────────────────────────────────────── */
export default function MovementsPage() {
  const [products, setProducts] = useState([]);

  /* ── Single-movement form (used for SALIDA and single ENTRADA) ── */
  const [form, setForm] = useState({
    type: 'ENTRADA',
    sale_type: '',
    quantity: '',
    unit_price: '',
    notes: '',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ── Multi-entrada state ── */
  const [multiMode, setMultiMode]       = useState(false);
  const [multiItems, setMultiItems]     = useState([]);          // { product, quantity, unit_price }
  const [multiProduct, setMultiProduct] = useState(null);
  const [multiQty, setMultiQty]         = useState('1');
  const [multiPrice, setMultiPrice]     = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    client.get('/products?active=true&page=1&limit=500').then((res) => setProducts(res.data.data));
  }, []);

  /* ── Single form helpers ── */
  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'type' && value === 'ENTRADA') next.sale_type = '';
      return next;
    });
  }

  /* ── Multi-entrada helpers ── */
  function addMultiItem() {
    if (!multiProduct || !multiQty || parseInt(multiQty) <= 0) return;
    const qty   = parseInt(multiQty);
    const price = parseInt(multiPrice) || 0;
    setMultiItems((prev) => {
      const existing = prev.findIndex((i) => i.product.id === multiProduct.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity:   updated[existing].quantity + qty,
          unit_price: price || updated[existing].unit_price,
        };
        return updated;
      }
      return [...prev, { product: multiProduct, quantity: qty, unit_price: price }];
    });
    setMultiProduct(null);
    setMultiQty('1');
    setMultiPrice('');
  }

  function removeMultiItem(idx) {
    setMultiItems((prev) => prev.filter((_, i) => i !== idx));
  }

  /* ── Submit: single movement ── */
  async function handleSubmitSingle(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await client.post('/movements', {
        product_id: selectedProduct.id,
        type:       form.type,
        sale_type:  form.type === 'SALIDA' ? form.sale_type : undefined,
        quantity:   parseInt(form.quantity),
        unit_price: parseInt(form.unit_price) || 0,
        notes:      form.notes,
      });
      const destLabel = form.type === 'SALIDA'
        ? (form.sale_type === 'interna' ? ' — Interna (Residentes)' : ' — Externa (Ajenos/Colaboradores)')
        : '';
      setSuccess(`Movimiento registrado — ${form.type} de ${form.quantity} unidades${destLabel}`);
      // Refresh products
      const res = await client.get('/products?active=true&page=1&limit=500');
      setProducts(res.data.data);
      const updated = res.data.data.find((p) => p.id === selectedProduct.id);
      setSelectedProduct(updated || null);
      setForm((prev) => ({ ...prev, sale_type: '', quantity: '', unit_price: '', notes: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  }

  /* ── Submit: multi-entrada ── */
  async function handleSubmitMulti() {
    if (!multiItems.length) return;
    setError('');
    setSuccess('');
    setLoading(true);
    let registered = 0;
    try {
      for (const item of multiItems) {
        await client.post('/movements', {
          product_id: item.product.id,
          type:       'ENTRADA',
          quantity:   item.quantity,
          unit_price: item.unit_price,
          notes:      form.notes || undefined,
        });
        registered++;
      }
      setSuccess(`✓ ${registered} entrada(s) registradas correctamente`);
      // Refresh products list
      const res = await client.get('/products?active=true&page=1&limit=500');
      setProducts(res.data.data);
      setMultiItems([]);
      setForm((prev) => ({ ...prev, notes: '' }));
    } catch (err) {
      setError(`Error en ítem ${registered + 1}: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const estimatedTotal =
    parseInt(form.quantity || 0) * parseInt(form.unit_price || 0);

  const multiTotal = multiItems.reduce(
    (sum, it) => sum + it.quantity * it.unit_price, 0
  );

  const canAddMulti = multiProduct && parseInt(multiQty) > 0;
  const canSubmitSingle =
    !loading &&
    selectedProduct &&
    form.quantity &&
    (form.type === 'ENTRADA' || form.sale_type);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Registrar Movimiento de Stock</h2>

      <div className="card p-6 space-y-5" id="movement-form">

        {/* ── Movement type toggle ── */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Tipo de Movimiento *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { handleChange('type', 'ENTRADA'); setMultiMode(false); }}
              id="btn-type-entrada"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                form.type === 'ENTRADA'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-xl">↑</span> ENTRADA
            </button>
            <button
              type="button"
              onClick={() => { handleChange('type', 'SALIDA'); setMultiMode(false); }}
              id="btn-type-salida"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                form.type === 'SALIDA'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="text-xl">↓</span> SALIDA
            </button>
          </div>
        </div>

        {/* ── Multi-entrada toggle (only for ENTRADA) ── */}
        {form.type === 'ENTRADA' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700">
            <button
              type="button"
              onClick={() => setMultiMode(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                !multiMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              id="btn-mode-single"
            >
              1 producto
            </button>
            <button
              type="button"
              onClick={() => setMultiMode(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                multiMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              id="btn-mode-multi"
            >
              📦 Múltiples productos
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            MULTI-ENTRADA MODE
        ═══════════════════════════════════════════════ */}
        {form.type === 'ENTRADA' && multiMode ? (
          <div className="space-y-4">
            {/* Row to add a new item */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agregar producto</p>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Producto</label>
                <ProductCombobox
                  products={products}
                  selected={multiProduct}
                  onSelect={setMultiProduct}
                  id="multi-product-search"
                />
              </div>
              {/* Stock preview */}
              {multiProduct && (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-xs">
                  <div>
                    <p className="text-slate-500 mb-0.5">Stock actual</p>
                    <p className="font-bold text-slate-200 text-base">{multiProduct.stock_current}</p>
                    <p className="text-slate-500">{multiProduct.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Stock mínimo</p>
                    <p className="font-semibold text-slate-300">{multiProduct.stock_minimum}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Categoría</p>
                    <p className="text-slate-300 leading-tight">{multiProduct.category_name}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Cantidad *</label>
                  <input
                    type="number" min="1"
                    className="form-input"
                    value={multiQty}
                    onChange={(e) => setMultiQty(e.target.value)}
                    id="multi-qty"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Precio Unitario (₲)</label>
                  <input
                    type="number" min="0"
                    className="form-input"
                    placeholder="0"
                    value={multiPrice}
                    onChange={(e) => setMultiPrice(e.target.value)}
                    id="multi-price"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addMultiItem}
                disabled={!canAddMulti}
                className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-add-multi-item"
              >
                + Agregar a la lista
              </button>
            </div>

            {/* Items table */}
            {multiItems.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-3 py-2 text-left font-semibold">Producto</th>
                      <th className="px-3 py-2 text-center font-semibold">Cant.</th>
                      <th className="px-3 py-2 text-right font-semibold">P. Unit.</th>
                      <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {multiItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <p className="text-slate-200 font-medium leading-tight">{item.product.name}</p>
                          <p className="text-xs text-slate-500">{item.product.sku}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-400">
                          +{item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">
                          {item.unit_price > 0 ? formatPYG(item.unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-200">
                          {item.unit_price > 0 ? formatPYG(item.quantity * item.unit_price) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeMultiItem(idx)}
                            className="text-slate-600 hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {multiTotal > 0 && (
                  <div className="flex justify-between items-center px-4 py-2.5 bg-slate-800/60 border-t border-slate-700">
                    <span className="text-xs text-slate-400">{multiItems.length} producto(s)</span>
                    <span className="font-bold text-emerald-400">{formatPYG(multiTotal)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Shared notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
              <textarea
                className="form-input resize-none"
                rows={2}
                placeholder="Ej. Compra a proveedor X, factura #1234"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                id="movement-notes-multi"
              />
            </div>

            {/* Feedback */}
            {error   && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">{success}</div>}

            <button
              type="button"
              onClick={handleSubmitMulti}
              disabled={loading || multiItems.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white"
              id="btn-submit-multi"
            >
              {loading ? 'Registrando…' : `↑ Registrar ${multiItems.length} entrada(s)`}
            </button>
          </div>

        ) : (
          /* ═══════════════════════════════════════════════
              SINGLE MOVEMENT MODE (ENTRADA or SALIDA)
          ═══════════════════════════════════════════════ */
          <form onSubmit={handleSubmitSingle} className="space-y-5">
            {/* Product search combobox */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Producto *</label>
              <ProductCombobox
                products={products}
                selected={selectedProduct}
                onSelect={setSelectedProduct}
                id="movement-product"
              />
            </div>

            {/* Product info card */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Stock actual</p>
                  <p className="font-bold text-slate-200 text-lg">{selectedProduct.stock_current}</p>
                  <p className="text-xs text-slate-500">{selectedProduct.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Stock mínimo</p>
                  <p className="font-semibold text-slate-300">{selectedProduct.stock_minimum}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Categoría</p>
                  <p className="text-slate-300 text-xs leading-tight">{selectedProduct.category_name}</p>
                </div>
              </div>
            )}

            {/* Sale type — only visible for SALIDA */}
            {form.type === 'SALIDA' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Destino de Venta *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('sale_type', 'interna')}
                    id="btn-sale-type-interna"
                    className={`p-4 rounded-xl border-2 text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                      form.sale_type === 'interna'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="font-semibold">Interna</span>
                    <span className="text-xs opacity-70">Residentes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('sale_type', 'externa')}
                    id="btn-sale-type-externa"
                    className={`p-4 rounded-xl border-2 text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                      form.sale_type === 'externa'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">🌐</span>
                    <span className="font-semibold">Externa</span>
                    <span className="text-xs opacity-70">Ajenos / Colaboradores</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quantity + Unit price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad *</label>
                <input
                  type="number" min="1"
                  className="form-input"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  required
                  id="movement-quantity"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Precio Unitario (₲)</label>
                <input
                  type="number" min="0"
                  className="form-input"
                  placeholder="0"
                  value={form.unit_price}
                  onChange={(e) => handleChange('unit_price', e.target.value)}
                  id="movement-unit-price"
                />
              </div>
            </div>

            {/* Total estimate */}
            {estimatedTotal > 0 && (
              <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-between">
                <span className="text-sm text-slate-400">Total estimado:</span>
                <span className="font-bold text-brand-400">{formatPYG(estimatedTotal)}</span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
              <textarea
                className="form-input resize-none"
                rows={3}
                placeholder="Ej. Compra a proveedor X, factura #1234"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                id="movement-notes"
              />
            </div>

            {/* Feedback */}
            {error   && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">✓ {success}</div>}

            <button
              type="submit"
              disabled={!canSubmitSingle}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                form.type === 'ENTRADA'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
              id="btn-submit-movement"
            >
              {loading ? 'Registrando…' : `Registrar ${form.type}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
