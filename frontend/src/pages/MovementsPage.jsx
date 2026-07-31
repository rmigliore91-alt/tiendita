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

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (!selected) setQuery(''); }, [selected]);

  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : products.slice(0, 20);

  function pick(p) { setQuery(`[${p.sku}] ${p.name}`); onSelect(p); setOpen(false); }
  function handleInput(val) { setQuery(val); onSelect(null); setOpen(true); }
  function clear() { setQuery(''); onSelect(null); setOpen(false); }

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
          <button type="button" onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && !selected && (
        <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.length > 0 ? filtered.map((p) => (
            <button key={p.id} type="button" onMouseDown={() => pick(p)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors">
              <p className="text-sm font-medium text-slate-200">{p.name}</p>
              <p className="text-xs text-slate-500">{p.sku} · Stock: {p.stock_current} {p.unit}</p>
            </button>
          )) : (
            <p className="px-4 py-3 text-sm text-slate-500">Sin resultados para "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Delivery cost distribution helpers
───────────────────────────────────────────────────────────── */

/**
 * Distributes a total delivery cost proportionally by each item's subtotal.
 * Falls back to equal distribution if all items have zero price.
 * Returns an array of delivery shares aligned to the items array.
 */
function distributeDelivery(items, totalDelivery) {
  if (!totalDelivery || totalDelivery <= 0) return items.map(() => 0);
  const subtotals = items.map((it) => it.quantity * it.unit_price);
  const grandTotal = subtotals.reduce((a, b) => a + b, 0);
  if (grandTotal <= 0) {
    // fallback: equal split by quantity
    const totalQty = items.reduce((a, it) => a + it.quantity, 0);
    return items.map((it) =>
      Math.round((it.quantity / totalQty) * totalDelivery)
    );
  }
  // proportional by subtotal value
  const shares = subtotals.map((s) => Math.round((s / grandTotal) * totalDelivery));
  // fix rounding so shares sum exactly to totalDelivery
  const diff = totalDelivery - shares.reduce((a, b) => a + b, 0);
  if (shares.length > 0) shares[0] += diff;
  return shares;
}

/** Cost per unit = purchase price + ceil(delivery_share / quantity) */
function effectiveCostPerUnit(unitPrice, deliveryShare, quantity) {
  if (quantity <= 0) return unitPrice;
  return unitPrice + Math.ceil(deliveryShare / quantity);
}

/* ─────────────────────────────────────────────────────────────
   BelowCostWarning banner
───────────────────────────────────────────────────────────── */
function BelowCostWarning({ items }) {
  if (!items.length) return null;
  return (
    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
        ⚠️ Precio de venta por debajo del costo real
      </p>
      {items.map((it, i) => (
        <p key={i} className="text-xs text-amber-300">
          <span className="font-semibold">{it.name}</span>: venta{' '}
          <span className="font-bold">{formatPYG(it.salePrice)}</span> &lt; costo real{' '}
          <span className="font-bold">{formatPYG(it.realCost)}</span>
        </p>
      ))}
      <p className="text-xs text-amber-500 mt-1">
        Actualizar el precio de venta para evitar pérdidas.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MovementsPage
───────────────────────────────────────────────────────────── */
export default function MovementsPage() {
  const [products, setProducts] = useState([]);

  /* ── Single-movement form ── */
  const [form, setForm] = useState({
    type:           'ENTRADA',
    sale_type:      '',
    quantity:       '',
    unit_price:     '',
    notes:          '',
    invoice_number: '',
  });
  const [selectedProduct,   setSelectedProduct]   = useState(null);
  const [singleDelivery,    setSingleDelivery]     = useState('');   // supplier delivery for single mode
  const [belowCostWarnings, setBelowCostWarnings] = useState([]);   // after submit

  /* ── Multi-entrada state ── */
  const [multiMode,         setMultiMode]         = useState(false);
  const [multiItems,        setMultiItems]        = useState([]);   // { product, quantity, unit_price }
  const [multiProduct,      setMultiProduct]      = useState(null);
  const [multiQty,          setMultiQty]          = useState('1');
  const [multiPrice,        setMultiPrice]        = useState('');
  const [multiDelivery,     setMultiDelivery]     = useState(''); // shared delivery cost for multi
  const [multiInvoice,      setMultiInvoice]      = useState(''); // invoice number for multi-entrada

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

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
    setBelowCostWarnings([]);
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

  /* ── Computed delivery data for MULTI mode ── */
  const totalDeliveryCost = parseInt(multiDelivery) || 0;
  const multiSubtotal     = multiItems.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const deliveryShares    = distributeDelivery(multiItems, totalDeliveryCost);

  const multiItemsWithCost = multiItems.map((it, idx) => ({
    ...it,
    deliveryShare: deliveryShares[idx] || 0,
    realCostPerUnit: effectiveCostPerUnit(it.unit_price, deliveryShares[idx] || 0, it.quantity),
  }));

  const multiBelowCostItems = multiItemsWithCost.filter(
    (it) => it.realCostPerUnit > 0 && it.product.sale_price > 0 && it.product.sale_price < it.realCostPerUnit
  );

  /* ── Computed delivery data for SINGLE mode ── */
  const singleQty          = parseInt(form.quantity) || 0;
  const singleUnitPrice    = parseInt(form.unit_price) || 0;
  const singleDeliveryCost = parseInt(singleDelivery) || 0;
  const singleRealCostPerUnit = effectiveCostPerUnit(singleUnitPrice, singleDeliveryCost, singleQty);
  const singleBelowCost    =
    form.type === 'ENTRADA' &&
    singleRealCostPerUnit > 0 &&
    selectedProduct?.sale_price > 0 &&
    selectedProduct.sale_price < singleRealCostPerUnit;

  /* ── Submit: single movement ── */
  async function handleSubmitSingle(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBelowCostWarnings([]);
    setLoading(true);
    try {
      const res = await client.post('/movements', {
        product_id:              selectedProduct.id,
        type:                    form.type,
        sale_type:               form.type === 'SALIDA' ? form.sale_type : undefined,
        quantity:                singleQty,
        unit_price:              singleUnitPrice,
        notes:                   form.notes,
        invoice_number:          form.invoice_number,
        supplier_delivery_cost:  form.type === 'ENTRADA' ? singleDeliveryCost : undefined,
        delivery_cost_share:     form.type === 'ENTRADA' ? singleDeliveryCost : undefined, // 100% for single
      });

      const destLabel = form.type === 'SALIDA'
        ? (form.sale_type === 'interna' ? ' — Interna (Residentes)' : ' — Externa (Ajenos/Colaboradores)')
        : '';
      setSuccess(`Movimiento registrado — ${form.type} de ${form.quantity} unidades${destLabel}`);

      if (res.data.below_cost_warning) {
        setBelowCostWarnings([{
          name:     selectedProduct.name,
          salePrice: res.data.sale_price,
          realCost:  res.data.cost_price_at_entry,
        }]);
      }

      const updRes = await client.get('/products?active=true&page=1&limit=500');
      setProducts(updRes.data.data);
      const updated = updRes.data.data.find((p) => p.id === selectedProduct.id);
      setSelectedProduct(updated || null);
      setForm((prev) => ({ ...prev, sale_type: '', quantity: '', unit_price: '', notes: '', invoice_number: '' }));
      setSingleDelivery('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  }

  /* ── Submit: multi-entrada ── */
  async function handleSubmitMulti() {
    if (!multiItems.length) return;
    if (!multiInvoice.trim()) {
      setError('El número de factura es requerido');
      return;
    }
    setError('');
    setSuccess('');
    setBelowCostWarnings([]);
    setLoading(true);
    let registered   = 0;
    const warnings   = [];
    try {
      for (let i = 0; i < multiItemsWithCost.length; i++) {
        const item = multiItemsWithCost[i];
        const res  = await client.post('/movements', {
          product_id:             item.product.id,
          type:                   'ENTRADA',
          quantity:               item.quantity,
          unit_price:             item.unit_price,
          notes:                  form.notes || undefined,
          invoice_number:         multiInvoice.trim(),
          supplier_delivery_cost: totalDeliveryCost,
          delivery_cost_share:    item.deliveryShare,
        });
        if (res.data.below_cost_warning) {
          warnings.push({
            name:     item.product.name,
            salePrice: res.data.sale_price,
            realCost:  res.data.cost_price_at_entry,
          });
        }
        registered++;
      }
      setSuccess(`✓ ${registered} entrada(s) registradas correctamente`);
      setBelowCostWarnings(warnings);
      const updRes = await client.get('/products?active=true&page=1&limit=500');
      setProducts(updRes.data.data);
      setMultiItems([]);
      setMultiDelivery('');
      setMultiInvoice('');
      setForm((prev) => ({ ...prev, notes: '' }));
    } catch (err) {
      setError(`Error en ítem ${registered + 1}: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const canAddMulti = multiProduct && parseInt(multiQty) > 0;
  const canSubmitSingle =
    !loading &&
    selectedProduct &&
    form.quantity &&
    form.invoice_number.trim() &&
    (form.type === 'ENTRADA' || form.sale_type);
  const canSubmitMulti =
    !loading &&
    multiItems.length > 0 &&
    multiInvoice.trim();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Registrar Movimiento de Stock</h2>

      <div className="card p-6 space-y-5" id="movement-form">

        {/* ── Movement type toggle ── */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Tipo de Movimiento *</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button"
              onClick={() => { handleChange('type', 'ENTRADA'); setMultiMode(false); }}
              id="btn-type-entrada"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                form.type === 'ENTRADA'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }`}>
              <span className="text-xl">↑</span> ENTRADA
            </button>
            <button type="button"
              onClick={() => { handleChange('type', 'SALIDA'); setMultiMode(false); }}
              id="btn-type-salida"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                form.type === 'SALIDA'
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              }`}>
              <span className="text-xl">↓</span> SALIDA
            </button>
          </div>
        </div>

        {/* ── Multi-entrada toggle ── */}
        {form.type === 'ENTRADA' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700">
            <button type="button" onClick={() => setMultiMode(false)} id="btn-mode-single"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                !multiMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}>
              1 producto
            </button>
            <button type="button" onClick={() => setMultiMode(true)} id="btn-mode-multi"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                multiMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}>
              📦 Múltiples productos
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            MULTI-ENTRADA MODE
        ═══════════════════════════════════════════════ */}
        {form.type === 'ENTRADA' && multiMode ? (
          <div className="space-y-4">

            {/* Add item row */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agregar producto</p>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Producto</label>
                <ProductCombobox products={products} selected={multiProduct}
                  onSelect={setMultiProduct} id="multi-product-search" />
              </div>
              {multiProduct && (
                <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-xs">
                  <div>
                    <p className="text-slate-500 mb-0.5">Stock actual</p>
                    <p className="font-bold text-slate-200 text-base">{multiProduct.stock_current}</p>
                    <p className="text-slate-500">{multiProduct.unit}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Precio venta</p>
                    <p className="font-semibold text-slate-300">{multiProduct.sale_price > 0 ? formatPYG(multiProduct.sale_price) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">Costo actual</p>
                    <p className="font-semibold text-slate-300">{multiProduct.cost_price > 0 ? formatPYG(multiProduct.cost_price) : '—'}</p>
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
                  <input type="number" min="1" className="form-input" value={multiQty}
                    onChange={(e) => setMultiQty(e.target.value)} id="multi-qty" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Precio de compra (₲)</label>
                  <input type="number" min="0" className="form-input" placeholder="0"
                    value={multiPrice} onChange={(e) => setMultiPrice(e.target.value)} id="multi-price" />
                </div>
              </div>
              <button type="button" onClick={addMultiItem} disabled={!canAddMulti}
                className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-add-multi-item">
                + Agregar a la lista
              </button>
            </div>

            {/* Items table with cost breakdown */}
            {multiItems.length > 0 && (
              <div className="space-y-3">
                {/* Delivery cost input — above the table */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      🚛 Costo de delivery del proveedor (₲)
                      <span className="text-slate-500 font-normal">(opcional)</span>
                    </label>
                    {totalDeliveryCost > 0 && (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                        se distribuye entre {multiItems.length} producto(s)
                      </span>
                    )}
                  </div>
                  <input
                    type="number" min="0"
                    className="form-input"
                    placeholder="Ej. 50000"
                    value={multiDelivery}
                    onChange={(e) => setMultiDelivery(e.target.value)}
                    id="multi-delivery-cost"
                  />
                  {totalDeliveryCost > 0 && (
                    <p className="text-xs text-slate-500">
                      Distribución proporcional por valor de compra de cada producto
                    </p>
                  )}
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-3 py-2 text-left font-semibold">Producto</th>
                        <th className="px-3 py-2 text-center font-semibold">Cant.</th>
                        <th className="px-3 py-2 text-right font-semibold">P. Compra</th>
                        {totalDeliveryCost > 0 && (
                          <th className="px-3 py-2 text-right font-semibold text-amber-400">+ Delivery</th>
                        )}
                        <th className={`px-3 py-2 text-right font-semibold ${totalDeliveryCost > 0 ? 'text-emerald-400' : ''}`}>
                          {totalDeliveryCost > 0 ? 'Costo Real/u' : 'Subtotal'}
                        </th>
                        <th className="px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {multiItemsWithCost.map((item, idx) => {
                        const belowCost = item.realCostPerUnit > 0 &&
                          item.product.sale_price > 0 &&
                          item.product.sale_price < item.realCostPerUnit;
                        return (
                          <tr key={idx} className={`transition-colors ${belowCost ? 'bg-amber-500/5' : 'hover:bg-slate-800/30'}`}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-start gap-1.5">
                                {belowCost && <span className="text-amber-400 text-sm mt-0.5" title="Precio venta por debajo del costo real">⚠️</span>}
                                <div>
                                  <p className="text-slate-200 font-medium leading-tight">{item.product.name}</p>
                                  <p className="text-xs text-slate-500">{item.product.sku}</p>
                                  {belowCost && (
                                    <p className="text-xs text-amber-400 mt-0.5">
                                      Venta: {formatPYG(item.product.sale_price)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-emerald-400">
                              +{item.quantity}
                            </td>
                            <td className="px-3 py-2.5 text-right text-slate-300">
                              {item.unit_price > 0 ? formatPYG(item.unit_price) : '—'}
                            </td>
                            {totalDeliveryCost > 0 && (
                              <td className="px-3 py-2.5 text-right text-amber-400 text-xs">
                                +{formatPYG(Math.ceil(item.deliveryShare / item.quantity))}/u
                                <p className="text-slate-600">{formatPYG(item.deliveryShare)} total</p>
                              </td>
                            )}
                            <td className={`px-3 py-2.5 text-right font-bold ${
                              totalDeliveryCost > 0
                                ? belowCost ? 'text-amber-400' : 'text-emerald-400'
                                : 'text-slate-200'
                            }`}>
                              {totalDeliveryCost > 0
                                ? formatPYG(item.realCostPerUnit)
                                : (item.unit_price > 0 ? formatPYG(item.quantity * item.unit_price) : '—')
                              }
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button type="button" onClick={() => removeMultiItem(idx)}
                                className="text-slate-600 hover:text-red-400 transition-colors" title="Eliminar">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary footer */}
                  <div className="px-4 py-3 bg-slate-800/60 border-t border-slate-700 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-400">
                      <span>{multiItems.length} producto(s) — Subtotal compra</span>
                      <span className="font-semibold text-slate-200">{formatPYG(multiSubtotal)}</span>
                    </div>
                    {totalDeliveryCost > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>🚛 Delivery proveedor</span>
                        <span className="font-semibold">+ {formatPYG(totalDeliveryCost)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-700 pt-1.5">
                      <span className="font-bold text-slate-100">Total costo real</span>
                      <span className="font-extrabold text-emerald-400">
                        {formatPYG(multiSubtotal + totalDeliveryCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live below-cost warning (before submit) */}
                {multiBelowCostItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      ⚠️ Precio de venta por debajo del costo real
                    </p>
                    {multiBelowCostItems.map((it, i) => (
                      <p key={i} className="text-xs text-amber-300">
                        <span className="font-semibold">{it.product.name}</span>: venta{' '}
                        <span className="font-bold">{formatPYG(it.product.sale_price)}</span> &lt; costo real{' '}
                        <span className="font-bold">{formatPYG(it.realCostPerUnit)}</span>/u
                      </p>
                    ))}
                    <p className="text-xs text-amber-500">Actualizar el precio de venta para evitar pérdidas.</p>
                  </div>
                )}
              </div>
            )}

            {/* Invoice number — multi */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                🧾 Número de Factura *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 001-001-0001234"
                value={multiInvoice}
                onChange={(e) => setMultiInvoice(e.target.value)}
                id="multi-invoice-number"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
              <textarea className="form-input resize-none" rows={2}
                placeholder="Ej. Compra a proveedor X"
                value={form.notes} onChange={(e) => handleChange('notes', e.target.value)}
                id="movement-notes-multi" />
            </div>

            {/* Feedback */}
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">{success}</div>}
            {belowCostWarnings.length > 0 && <BelowCostWarning items={belowCostWarnings} />}

            <button type="button" onClick={handleSubmitMulti}
              disabled={!canSubmitMulti}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white"
              id="btn-submit-multi">
              {loading ? 'Registrando…' : `↑ Registrar ${multiItems.length} entrada(s)`}
            </button>
          </div>

        ) : (
          /* ═══════════════════════════════════════════════
              SINGLE MOVEMENT MODE (ENTRADA or SALIDA)
          ═══════════════════════════════════════════════ */
          <form onSubmit={handleSubmitSingle} className="space-y-5">
            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Producto *</label>
              <ProductCombobox products={products} selected={selectedProduct}
                onSelect={setSelectedProduct} id="movement-product" />
            </div>

            {/* Product info card */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 grid grid-cols-4 gap-3 text-sm">
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
                  <p className="text-xs text-slate-500 mb-0.5">Precio venta</p>
                  <p className="font-semibold text-slate-300 text-xs">
                    {selectedProduct.sale_price > 0 ? formatPYG(selectedProduct.sale_price) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Costo actual</p>
                  <p className="font-semibold text-slate-300 text-xs">
                    {selectedProduct.cost_price > 0 ? formatPYG(selectedProduct.cost_price) : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Sale type — only for SALIDA */}
            {form.type === 'SALIDA' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Destino de Venta *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleChange('sale_type', 'interna')} id="btn-sale-type-interna"
                    className={`p-4 rounded-xl border-2 text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                      form.sale_type === 'interna'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}>
                    <span className="text-2xl">🏠</span>
                    <span className="font-semibold">Interna</span>
                    <span className="text-xs opacity-70">Residentes</span>
                  </button>
                  <button type="button" onClick={() => handleChange('sale_type', 'externa')} id="btn-sale-type-externa"
                    className={`p-4 rounded-xl border-2 text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                      form.sale_type === 'externa'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                    }`}>
                    <span className="text-2xl">🌐</span>
                    <span className="font-semibold">Externa</span>
                    <span className="text-xs opacity-70">Ajenos / Colaboradores</span>
                  </button>
                </div>
              </div>
            )}

            {/* Invoice number */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                🧾 Número de Factura *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej. 001-001-0001234"
                value={form.invoice_number}
                onChange={(e) => handleChange('invoice_number', e.target.value)}
                required
                id="movement-invoice-number"
              />
            </div>

            {/* Quantity + Unit price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cantidad *</label>
                <input type="number" min="1" className="form-input" placeholder="0"
                  value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)}
                  required id="movement-quantity" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {form.type === 'ENTRADA' ? 'Precio de compra (₲)' : 'Precio Unitario (₲)'}
                </label>
                <input type="number" min="0" className="form-input" placeholder="0"
                  value={form.unit_price} onChange={(e) => handleChange('unit_price', e.target.value)}
                  id="movement-unit-price" />
              </div>
            </div>

            {/* Delivery cost — only for ENTRADA */}
            {form.type === 'ENTRADA' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  🚛 Delivery del proveedor (₲)
                  <span className="text-slate-600 font-normal">(opcional)</span>
                </label>
                <input type="number" min="0" className="form-input" placeholder="0"
                  value={singleDelivery} onChange={(e) => setSingleDelivery(e.target.value)}
                  id="movement-delivery-cost" />
              </div>
            )}

            {/* Cost breakdown card — ENTRADA only, when we have enough data */}
            {form.type === 'ENTRADA' && singleQty > 0 && singleUnitPrice > 0 && (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2 text-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desglose de costo</p>
                <div className="flex justify-between text-slate-400">
                  <span>Precio de compra</span>
                  <span>{formatPYG(singleUnitPrice)}/u</span>
                </div>
                {singleDeliveryCost > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>🚛 Delivery / {singleQty} u</span>
                    <span>+ {formatPYG(Math.ceil(singleDeliveryCost / singleQty))}/u</span>
                  </div>
                )}
                <div className={`flex justify-between pt-2 border-t border-slate-700 font-bold ${singleBelowCost ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <span>Costo real por unidad</span>
                  <span>{formatPYG(singleRealCostPerUnit)}</span>
                </div>
                {selectedProduct?.sale_price > 0 && (
                  <div className={`flex justify-between text-xs ${singleBelowCost ? 'text-amber-400' : 'text-slate-500'}`}>
                    <span>Precio de venta actual</span>
                    <span className="font-semibold">{formatPYG(selectedProduct.sale_price)}</span>
                  </div>
                )}
                {selectedProduct && singleUnitPrice > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total compra ({singleQty} u)</span>
                    <span className="font-semibold text-slate-300">{formatPYG(singleQty * singleUnitPrice + singleDeliveryCost)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Below-cost warning — live */}
            {singleBelowCost && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">⚠️ Precio de venta por debajo del costo real</p>
                <p>
                  Venta actual: <strong>{formatPYG(selectedProduct.sale_price)}</strong> &lt; Costo real:{' '}
                  <strong>{formatPYG(singleRealCostPerUnit)}</strong>/u
                </p>
                <p className="text-amber-500">Actualizar el precio de venta para evitar pérdidas.</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Notas (opcional)</label>
              <textarea className="form-input resize-none" rows={3}
                placeholder="Ej. Compra a proveedor X"
                value={form.notes} onChange={(e) => handleChange('notes', e.target.value)}
                id="movement-notes" />
            </div>

            {/* Feedback */}
            {error   && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">✓ {success}</div>}
            {belowCostWarnings.length > 0 && <BelowCostWarning items={belowCostWarnings} />}

            <button type="submit" disabled={!canSubmitSingle}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                form.type === 'ENTRADA'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
              id="btn-submit-movement">
              {loading ? 'Registrando…' : `Registrar ${form.type}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
