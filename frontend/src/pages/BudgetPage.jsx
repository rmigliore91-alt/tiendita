import { useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { formatPYG } from '../utils/formatters';

/* ─── Delivery cost formula ─────────────────────────────────────────────── */
function calcDeliveryCost(km) {
  const d = parseFloat(km);
  if (isNaN(d) || d <= 0) return 0;
  if (d <= 2)  return 10_000;
  if (d < 7)   return 20_000;
  if (d < 11)  return 25_000;
  if (d < 15)  return 30_000;
  return 30_000 + (d - 14) * 2_000;
}

function deliveryTier(km) {
  const d = parseFloat(km);
  if (isNaN(d) || d <= 0) return null;
  if (d <= 2)  return { label: 'Zona 1  (0 – 2 km)',            color: 'emerald' };
  if (d < 7)   return { label: 'Zona 2  (2 – 7 km)',            color: 'cyan'    };
  if (d < 11)  return { label: 'Zona 3  (7 – 11 km)',           color: 'amber'   };
  if (d < 15)  return { label: 'Zona 4  (11 – 15 km)',          color: 'orange'  };
  return          { label: 'Zona 5  (> 14 km — variable)',       color: 'red'     };
}

const tierColors = {
  emerald: 'border-tertiary-container bg-tertiary-fixed text-tertiary',
  cyan:    'border-info    bg-info-container    text-on-info-container',
  amber:   'border-warning   bg-warning-container   text-on-warning-container',
  orange:  'border-caution  bg-caution-container  text-on-caution-container',
  red:     'border-error     bg-error-container     text-error',
};

function todayLabel() {
  return new Date().toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/* ─── Mini inline form to create a new contact ──────────────── */
function NewContactInline({ initialName, onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: initialName || '', ruc: '', email: '', phone1: '', phone2: '', address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(f) { return (e) => setForm((p) => ({ ...p, [f]: e.target.value })); }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/contacts', form);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear contacto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 p-4 rounded-xl border border-primary-fixed-dim bg-primary-fixed/40 space-y-3">
      <p className="text-xs font-semibold text-primary-container uppercase tracking-wider">Nuevo contacto</p>
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Nombre *</label>
            <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Nombre / Razón social" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">RUC</label>
            <input className="form-input" value={form.ruc} onChange={set('ruc')} placeholder="80012345-6" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Teléfono 1</label>
            <input className="form-input" value={form.phone1} onChange={set('phone1')} placeholder="0981 123 456" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Teléfono 2</label>
            <input className="form-input" value={form.phone2} onChange={set('phone2')} placeholder="021 123 456" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Dirección</label>
          <input className="form-input" value={form.address} onChange={set('address')} placeholder="Calle, barrio, ciudad" />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">E-mail</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="cliente@mail.com" />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 text-xs justify-center">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 text-xs justify-center">
            {loading ? 'Guardando…' : 'Crear y seleccionar'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Contact combobox ───────────────────────────────────────── */
function ContactCombobox({ selected, onSelect }) {
  const [query, setQuery]         = useState(selected?.name || '');
  const [suggestions, setSuggs]   = useState([]);
  const [open, setOpen]           = useState(false);
  const [creating, setCreating]   = useState(false);
  const timer                     = useRef(null);
  const wrapRef                   = useRef(null);

  // close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleInput(val) {
    setQuery(val);
    setOpen(true);
    onSelect(null); // clear selection while typing
    clearTimeout(timer.current);
    if (!val.trim()) { setSuggs([]); return; }
    timer.current = setTimeout(async () => {
      const res = await client.get(`/contacts/search?q=${encodeURIComponent(val)}`);
      setSuggs(res.data);
    }, 250);
  }

  function pick(contact) {
    setQuery(contact.name);
    onSelect(contact);
    setOpen(false);
    setSuggs([]);
  }

  function handleCreated(contact) {
    setCreating(false);
    pick(contact);
  }

  function clear() {
    setQuery('');
    onSelect(null);
    setSuggs([]);
    setOpen(false);
    setCreating(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs text-on-surface-variant mb-1.5">
        Buscar contacto existente o crear nuevo
      </label>
      <div className="relative">
        <input
          type="text"
          className="form-input pr-8"
          placeholder="Nombre, RUC o teléfono…"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (query) setOpen(true); }}
          id="budget-contact-search"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-primary-fixed border border-primary-fixed-dim text-sm">
          <span className="text-primary-container font-semibold"><span className="material-symbol text-[16px] align-[-3px] mr-1" aria-hidden="true">check_circle</span>{selected.name}</span>
          {selected.ruc && <span className="text-on-surface-variant text-xs">RUC: {selected.ruc}</span>}
          {selected.phone1 && <span className="text-on-surface-variant text-xs">· {selected.phone1}</span>}
        </div>
      )}

      {/* Dropdown */}
      {open && !selected && (
        <div className="absolute z-30 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => pick(c)}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface-container transition-colors"
                >
                  <p className="text-sm font-medium text-on-surface">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {[c.ruc, c.phone1, c.email].filter(Boolean).join(' · ')}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={() => { setOpen(false); setCreating(true); }}
                className="w-full text-left px-4 py-2.5 border-t border-outline-variant hover:bg-surface-container transition-colors text-primary-container text-sm"
              >
                <span className="material-symbol text-[16px] align-[-3px] mr-1" aria-hidden="true">person_add</span>Crear &quot;{query}&quot; como nuevo contacto
              </button>
            </>
          ) : query.trim() ? (
            <button
              type="button"
              onMouseDown={() => { setOpen(false); setCreating(true); }}
              className="w-full text-left px-4 py-2.5 hover:bg-surface-container transition-colors text-primary-container text-sm"
            >
              <span className="material-symbol text-[16px] align-[-3px] mr-1" aria-hidden="true">person_add</span>Crear &quot;{query}&quot; como nuevo contacto
            </button>
          ) : null}
        </div>
      )}

      {/* Inline create form */}
      {creating && (
        <NewContactInline
          initialName={query}
          onCreated={handleCreated}
          onCancel={() => setCreating(false)}
        />
      )}
    </div>
  );
}

/* ─── Confirm Sale Modal ─────────────────────────────────────── */
function ConfirmSaleModal({ onConfirm, onCancel, confirming }) {
  const [saleType, setSaleType] = useState('externa');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-on-surface mb-1">Confirmar venta</h3>
          <p className="text-sm text-on-surface-variant">
            Esto generará movimientos de <span className="text-error font-semibold">SALIDA</span> de
            stock para cada producto del presupuesto. Esta acción no se puede deshacer.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Destino de venta *</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSaleType('interna')}
              className={`p-4 rounded-xl border-2 text-sm transition-all flex flex-col items-center gap-1 ${
                saleType === 'interna'
                  ? 'border-brand bg-brand-soft text-brand-ink'
                  : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'
              }`}
              id="confirm-sale-interna"
            >
              <span className="material-symbol text-[28px]" aria-hidden="true">storefront</span>
              <span className="font-semibold">Interna</span>
              <span className="text-xs opacity-70">Residentes</span>
            </button>
            <button
              type="button"
              onClick={() => setSaleType('externa')}
              className={`p-4 rounded-xl border-2 text-sm transition-all flex flex-col items-center gap-1 ${
                saleType === 'externa'
                  ? 'border-warning bg-warning-container text-on-warning-container'
                  : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'
              }`}
              id="confirm-sale-externa"
            >
              <span className="material-symbol text-[28px]" aria-hidden="true">language</span>
              <span className="font-semibold">Externa</span>
              <span className="text-xs opacity-70">Ajenos / Colaboradores</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="btn-secondary flex-1 justify-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(saleType)}
            disabled={confirming}
            className="flex-1 py-2.5 px-4 rounded-xl bg-tertiary-container hover:bg-tertiary-container text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            id="btn-confirm-sale-submit"
          >
            {confirming ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirmando…
              </>
            ) : (
              'Confirmar venta'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main BudgetPage ────────────────────────────────────────── */
export default function BudgetPage() {
  const [products, setProducts]         = useState([]);
  const [items, setItems]               = useState([]);
  const [productId, setProductId]       = useState('');
  const [qty, setQty]                   = useState('1');
  const [unitPrice, setUnitPrice]       = useState('');

  const [withDelivery, setWithDelivery] = useState(false);
  const [distance, setDistance]         = useState('');

  const [contact, setContact]           = useState(null); // selected contact object
  const [notes, setNotes]               = useState('');

  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  // Saved budget state (for confirm-sale)
  const [savedBudgetId, setSavedBudgetId]         = useState(null);
  const [budgetConfirmed, setBudgetConfirmed]     = useState(false);
  const [showConfirmModal, setShowConfirmModal]   = useState(false);
  const [confirming, setConfirming]               = useState(false);

  useEffect(() => {
    client.get('/products?active=true&page=1&limit=500')
      .then((res) => setProducts(res.data.data));
  }, []);

  /* ── Reset budget state when items cleared ── */
  function resetBudget() {
    setItems([]);
    setSavedBudgetId(null);
    setBudgetConfirmed(false);
    setSaveMsg('');
  }

  /* ── item management ── */
  function addItem() {
    if (!productId || !qty || parseInt(qty) <= 0) return;
    const p = products.find((x) => x.id === parseInt(productId));
    if (!p) return;
    const price = parseInt(unitPrice) || 0;
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.product.id === p.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          qty: updated[existing].qty + parseInt(qty),
          unitPrice: price || updated[existing].unitPrice,
        };
        return updated;
      }
      return [...prev, { product: p, qty: parseInt(qty), unitPrice: price }];
    });
    setProductId('');
    setQty('1');
    setUnitPrice('');
    // Invalidate saved budget when items change
    setSavedBudgetId(null);
    setBudgetConfirmed(false);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setSavedBudgetId(null);
    setBudgetConfirmed(false);
  }

  function updateItemQty(idx, val) {
    const n = parseInt(val);
    if (isNaN(n) || n <= 0) return;
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, qty: n } : it));
    setSavedBudgetId(null);
    setBudgetConfirmed(false);
  }

  function updateItemPrice(idx, val) {
    const n = parseInt(val);
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: isNaN(n) ? 0 : n } : it));
    setSavedBudgetId(null);
    setBudgetConfirmed(false);
  }

  /* ── totals ── */
  const subtotal     = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const deliveryCost = withDelivery ? Math.round(calcDeliveryCost(distance)) : 0;
  const total        = subtotal + deliveryCost;
  const tier         = withDelivery ? deliveryTier(distance) : null;

  /* ── save budget ── */
  async function handleSave() {
    if (!items.length) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await client.post('/budgets', {
        contact_id:    contact?.id || null,
        client_name:   contact?.name || null,
        client_phone:  contact?.phone1 || null,
        subtotal,
        delivery_cost: deliveryCost,
        total,
        with_delivery: withDelivery,
        distance_km:   distance || null,
        notes,
        items: items.map((it) => ({
          product_id:   it.product.id,
          product_name: it.product.name,
          sku:          it.product.sku,
          quantity:     it.qty,
          unit_price:   it.unitPrice,
        })),
      });
      setSavedBudgetId(res.data.id);
      setSaveMsg('✓ Presupuesto guardado correctamente');
      setTimeout(() => setSaveMsg(''), 5000);
    } catch (err) {
      setSaveMsg('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }

  /* ── confirm sale ── */
  async function handleConfirmSale(saleType) {
    // If not yet saved, save first
    let budgetId = savedBudgetId;
    if (!budgetId) {
      setSaving(true);
      try {
        const res = await client.post('/budgets', {
          contact_id:    contact?.id || null,
          client_name:   contact?.name || null,
          client_phone:  contact?.phone1 || null,
          subtotal,
          delivery_cost: deliveryCost,
          total,
          with_delivery: withDelivery,
          distance_km:   distance || null,
          notes,
          items: items.map((it) => ({
            product_id:   it.product.id,
            product_name: it.product.name,
            sku:          it.product.sku,
            quantity:     it.qty,
            unit_price:   it.unitPrice,
          })),
        });
        budgetId = res.data.id;
        setSavedBudgetId(budgetId);
      } catch (err) {
        setSaveMsg('Error al guardar: ' + (err.response?.data?.error || err.message));
        setSaving(false);
        setShowConfirmModal(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    setConfirming(true);
    try {
      await client.post(`/budgets/${budgetId}/confirm-sale`, { sale_type: saleType });
      setBudgetConfirmed(true);
      setShowConfirmModal(false);
      setSaveMsg(`✓ Venta confirmada — stock descontado correctamente`);
    } catch (err) {
      setSaveMsg('Error al confirmar venta: ' + (err.response?.data?.error || err.message));
      setShowConfirmModal(false);
    } finally {
      setConfirming(false);
    }
  }

  /* ── print ── */
  function handlePrint() { window.print(); }

  const canAdd = productId && parseInt(qty) > 0;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #budget-print, #budget-print * { visibility: visible !important; }
          #budget-print { position: absolute; inset: 0; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      {showConfirmModal && (
        <ConfirmSaleModal
          onConfirm={handleConfirmSale}
          onCancel={() => setShowConfirmModal(false)}
          confirming={confirming}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <h2 className="page-title">Presupuesto para Cliente</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            {items.length > 0 && !budgetConfirmed && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-secondary"
                id="btn-save-budget"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            )}

            {/* Confirm sale button */}
            {items.length > 0 && !budgetConfirmed && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={saving || confirming}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-tertiary-container hover:bg-tertiary-container text-white font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                id="btn-confirm-sale"
              >
                <span className="material-symbol text-[18px]" aria-hidden="true">check_circle</span> Confirmar venta
              </button>
            )}

            {/* Confirmed badge */}
            {budgetConfirmed && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-tertiary-fixed border border-tertiary-fixed-dim text-tertiary font-semibold text-sm">
                <span className="material-symbol text-[18px]" aria-hidden="true">check_circle</span> Venta confirmada
              </span>
            )}

            <button
              onClick={handlePrint}
              disabled={items.length === 0}
              className="btn-primary disabled:opacity-40"
              id="btn-print-budget"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir / PDF
            </button>
          </div>
        </div>

        {saveMsg && (
          <div className={`no-print p-3 rounded-lg text-sm border ${saveMsg.startsWith('✓') ? 'bg-tertiary-fixed border-tertiary-fixed-dim text-tertiary' : 'bg-error-container border-error-outline text-error'}`}>
            {saveMsg}
          </div>
        )}

        {/* ═══ Cliente ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbol text-[20px] text-primary-container" aria-hidden="true">person</span> Cliente
          </h3>
          <ContactCombobox selected={contact} onSelect={setContact} />
        </div>

        {/* ═══ Agregar productos ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbol text-[20px] text-primary-container" aria-hidden="true">inventory_2</span> Agregar productos
          </h3>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
              <label className="block text-xs text-on-surface-variant mb-1.5">Producto</label>
              <select
                className="form-input"
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  const p = products.find((x) => x.id === parseInt(e.target.value));
                  if (p) setUnitPrice(p.sale_price != null ? String(p.sale_price) : '');
                  else setUnitPrice('');
                }}
                id="budget-product-select"
              >
                <option value="">Seleccionar…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-on-surface-variant mb-1.5">Cantidad</label>
              <input type="number" min="1" className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} id="budget-qty" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-on-surface-variant mb-1.5">Precio unitario (₲)</label>
              <input type="number" min="0" className="form-input" placeholder="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} id="budget-unit-price" />
            </div>
            <div className="col-span-2">
              <button
                type="button"
                onClick={addItem}
                disabled={!canAdd}
                className="w-full py-2 rounded-lg bg-primary-container hover:bg-primary-container text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-add-budget-item"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Delivery ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbol text-[20px] text-primary-container" aria-hidden="true">local_shipping</span> Delivery
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button type="button" onClick={() => setWithDelivery(false)} id="btn-no-delivery"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex flex-col items-center gap-1 ${!withDelivery ? 'border-primary-container bg-primary-fixed text-primary-container' : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'}`}>
              <span className="material-symbol text-[28px]" aria-hidden="true">storefront</span><span>Sin delivery</span><span className="text-xs font-normal opacity-70">Retira en local</span>
            </button>
            <button type="button" onClick={() => setWithDelivery(true)} id="btn-with-delivery"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex flex-col items-center gap-1 ${withDelivery ? 'border-info bg-info-container text-on-info-container' : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'}`}>
              <span className="material-symbol text-[28px]" aria-hidden="true">local_shipping</span><span>Con delivery</span><span className="text-xs font-normal opacity-70">Envío a domicilio</span>
            </button>
          </div>

          {withDelivery && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-on-surface-variant mb-1.5">Distancia aproximada (km)</label>
                <input type="number" min="0" step="0.1" className="form-input" placeholder="Ej. 5.3" value={distance} onChange={(e) => setDistance(e.target.value)} id="budget-distance" />
              </div>
              {tier && (
                <div className={`flex items-center justify-between p-3 rounded-xl border ${tierColors[tier.color]}`}>
                  <span className="text-sm font-medium">{tier.label}</span>
                  <span className="text-lg font-bold">{formatPYG(deliveryCost)}</span>
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-surface-container-high text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider">
                      <th className="px-3 py-2 text-left font-semibold">Zona</th>
                      <th className="px-3 py-2 text-left font-semibold">Distancia</th>
                      <th className="px-3 py-2 text-right font-semibold">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {[
                      { zone: 'Zona 1', range: '0 – 2 km',   cost: 10_000, color: 'text-tertiary' },
                      { zone: 'Zona 2', range: '2 – 7 km',   cost: 20_000, color: 'text-on-info-container'    },
                      { zone: 'Zona 3', range: '7 – 11 km',  cost: 25_000, color: 'text-on-warning-container'   },
                      { zone: 'Zona 4', range: '11 – 15 km', cost: 30_000, color: 'text-on-caution-container'  },
                      { zone: 'Zona 5', range: '> 14 km',    cost: null,   color: 'text-error'     },
                    ].map((row) => (
                      <tr key={row.zone} className="bg-surface-container-low hover:bg-surface-container-low transition-colors">
                        <td className={`px-3 py-2 font-semibold ${row.color}`}>{row.zone}</td>
                        <td className="px-3 py-2 text-on-surface-variant">{row.range}</td>
                        <td className="px-3 py-2 text-right text-on-surface font-medium">
                          {row.cost != null ? formatPYG(row.cost) : '₲ 30.000 + ₲ 2.000/km extra'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Notas ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbol text-[20px] text-primary-container" aria-hidden="true">notes</span> Observaciones (opcional)
          </h3>
          <textarea
            className="form-input resize-none" rows={2}
            placeholder="Condiciones de pago, validez del presupuesto, etc."
            value={notes} onChange={(e) => setNotes(e.target.value)} id="budget-notes"
          />
        </div>

        {/* ═══ Preview imprimible ═══ */}
        {items.length > 0 && (
          <div id="budget-print" className="card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold text-xl">T</div>
                  <div>
                    <p className="font-bold text-on-surface text-lg leading-tight">Taita</p>
                    <p className="text-xs text-on-surface-variant">tienda.taita.com.py</p>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-on-surface mt-2">PRESUPUESTO</p>
                {budgetConfirmed && (
                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-tertiary-fixed border border-tertiary-fixed-dim text-tertiary text-xs font-semibold">
                    <span className="material-symbol text-[18px]" aria-hidden="true">check_circle</span> Venta confirmada
                  </span>
                )}
              </div>
              <div className="text-right text-sm text-on-surface-variant space-y-1">
                <p>Fecha: <span className="text-on-surface font-medium">{todayLabel()}</span></p>
                {savedBudgetId && (
                  <p>Nro: <span className="text-on-surface font-medium">#{savedBudgetId}</span></p>
                )}
                {contact && (
                  <>
                    <p>Cliente: <span className="text-on-surface font-medium">{contact.name}</span></p>
                    {contact.ruc    && <p>RUC: <span className="text-on-surface font-medium">{contact.ruc}</span></p>}
                    {contact.phone1 && <p>Tel: <span className="text-on-surface font-medium">{contact.phone1}</span></p>}
                    {contact.address && <p className="max-w-[200px] text-right">{contact.address}</p>}
                  </>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="rounded-xl overflow-hidden border border-outline-variant">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container-lowest text-on-surface-variant text-xs uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-semibold">Producto</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Cant.</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Precio unit.</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Subtotal</th>
                    <th className="px-4 py-2.5 text-center font-semibold no-print"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-on-surface">
                        <p className="font-medium">{it.product.name}</p>
                        <p className="text-xs text-on-surface-variant">{it.product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" min="1" className="w-16 text-center bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container no-print"
                          value={it.qty} onChange={(e) => updateItemQty(idx, e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" min="0" className="w-28 text-right bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container no-print"
                          value={it.unitPrice} onChange={(e) => updateItemPrice(idx, e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-on-surface">
                        {formatPYG(it.qty * it.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <button onClick={() => removeItem(idx)} className="text-outline hover:text-error transition-colors" title="Eliminar">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal productos</span>
                  <span className="font-medium text-on-surface">{formatPYG(subtotal)}</span>
                </div>
                {withDelivery && (
                  <div className={`flex justify-between rounded-lg px-3 py-2 border ${tier ? tierColors[tier.color] : 'border-outline-variant'}`}>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbol text-[16px] align-[-3px] mr-1" aria-hidden="true">local_shipping</span>Delivery
                      {distance && <span className="text-xs opacity-70">({parseFloat(distance).toFixed(1)} km)</span>}
                    </span>
                    <span className="font-semibold">{formatPYG(deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-outline-variant">
                  <span className="font-bold text-on-surface text-base">TOTAL</span>
                  <span className="font-extrabold text-primary-container text-xl">{formatPYG(total)}</span>
                </div>
              </div>
            </div>

            {notes && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface-variant">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-on-surface">{notes}</p>
              </div>
            )}

            <div className="text-center text-xs text-outline pt-2 border-t border-surface-container-high">
              Presupuesto válido por 48 hs · tienda.taita.com.py
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="card p-10 text-center text-on-surface-variant no-print">
            <span className="material-symbol text-[40px] text-outline block mb-3" aria-hidden="true">request_quote</span>
            <p className="text-sm">Agregá productos para generar el presupuesto</p>
          </div>
        )}
      </div>
    </>
  );
}
