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
  emerald: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  cyan:    'border-cyan-500    bg-cyan-500/10    text-cyan-400',
  amber:   'border-amber-500   bg-amber-500/10   text-amber-400',
  orange:  'border-orange-500  bg-orange-500/10  text-orange-400',
  red:     'border-red-500     bg-red-500/10     text-red-400',
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
    <div className="mt-3 p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-3">
      <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Nuevo contacto</p>
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre *</label>
            <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Nombre / Razón social" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">RUC</label>
            <input className="form-input" value={form.ruc} onChange={set('ruc')} placeholder="80012345-6" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Teléfono 1</label>
            <input className="form-input" value={form.phone1} onChange={set('phone1')} placeholder="0981 123 456" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Teléfono 2</label>
            <input className="form-input" value={form.phone2} onChange={set('phone2')} placeholder="021 123 456" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Dirección</label>
          <input className="form-input" value={form.address} onChange={set('address')} placeholder="Calle, barrio, ciudad" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">E-mail</label>
          <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="cliente@mail.com" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 text-xs justify-center">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 text-xs justify-center">
            {loading ? 'Guardando…' : '✓ Crear y seleccionar'}
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
      <label className="block text-xs text-slate-500 mb-1.5">
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
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Selected badge */}
      {selected && (
        <div className="mt-2 flex items-center gap-2 p-2.5 rounded-lg bg-brand-500/10 border border-brand-500/30 text-sm">
          <span className="text-brand-400 font-semibold">✓ {selected.name}</span>
          {selected.ruc && <span className="text-slate-500 text-xs">RUC: {selected.ruc}</span>}
          {selected.phone1 && <span className="text-slate-500 text-xs">· {selected.phone1}</span>}
        </div>
      )}

      {/* Dropdown */}
      {open && !selected && (
        <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => pick(c)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors"
                >
                  <p className="text-sm font-medium text-slate-200">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    {[c.ruc, c.phone1, c.email].filter(Boolean).join(' · ')}
                  </p>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={() => { setOpen(false); setCreating(true); }}
                className="w-full text-left px-4 py-2.5 border-t border-slate-700 hover:bg-slate-700 transition-colors text-brand-400 text-sm"
              >
                ➕ Crear &quot;{query}&quot; como nuevo contacto
              </button>
            </>
          ) : query.trim() ? (
            <button
              type="button"
              onMouseDown={() => { setOpen(false); setCreating(true); }}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors text-brand-400 text-sm"
            >
              ➕ Crear &quot;{query}&quot; como nuevo contacto
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

  useEffect(() => {
    client.get('/products?active=true&page=1&limit=500')
      .then((res) => setProducts(res.data.data));
  }, []);

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
  }

  function removeItem(idx) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  function updateItemQty(idx, val) {
    const n = parseInt(val);
    if (isNaN(n) || n <= 0) return;
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, qty: n } : it));
  }

  function updateItemPrice(idx, val) {
    const n = parseInt(val);
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, unitPrice: isNaN(n) ? 0 : n } : it));
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
      await client.post('/budgets', {
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
      setSaveMsg('✓ Presupuesto guardado correctamente');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (err) {
      setSaveMsg('Error al guardar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
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

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-slate-100">💰 Presupuesto para Cliente</h2>
          <div className="flex gap-2">
            {items.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-secondary"
                id="btn-save-budget"
              >
                {saving ? '⏳ Guardando…' : '💾 Guardar'}
              </button>
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
          <div className={`no-print p-3 rounded-lg text-sm border ${saveMsg.startsWith('✓') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {saveMsg}
          </div>
        )}

        {/* ═══ Cliente ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="text-base">👤</span> Cliente
          </h3>
          <ContactCombobox selected={contact} onSelect={setContact} />
        </div>

        {/* ═══ Agregar productos ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="text-base">📦</span> Agregar productos
          </h3>
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-5">
              <label className="block text-xs text-slate-500 mb-1.5">Producto</label>
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
              <label className="block text-xs text-slate-500 mb-1.5">Cantidad</label>
              <input type="number" min="1" className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} id="budget-qty" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-slate-500 mb-1.5">Precio unitario (₲)</label>
              <input type="number" min="0" className="form-input" placeholder="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} id="budget-unit-price" />
            </div>
            <div className="col-span-2">
              <button
                type="button"
                onClick={addItem}
                disabled={!canAdd}
                className="w-full py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="btn-add-budget-item"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Delivery ═══ */}
        <div className="card p-5 no-print">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="text-base">🚚</span> Delivery
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button type="button" onClick={() => setWithDelivery(false)} id="btn-no-delivery"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex flex-col items-center gap-1 ${!withDelivery ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'}`}>
              <span className="text-2xl">🏪</span><span>Sin delivery</span><span className="text-xs font-normal opacity-70">Retira en local</span>
            </button>
            <button type="button" onClick={() => setWithDelivery(true)} id="btn-with-delivery"
              className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all duration-150 flex flex-col items-center gap-1 ${withDelivery ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'}`}>
              <span className="text-2xl">🚚</span><span>Con delivery</span><span className="text-xs font-normal opacity-70">Envío a domicilio</span>
            </button>
          </div>

          {withDelivery && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Distancia aproximada (km)</label>
                <input type="number" min="0" step="0.1" className="form-input" placeholder="Ej. 5.3" value={distance} onChange={(e) => setDistance(e.target.value)} id="budget-distance" />
              </div>
              {tier && (
                <div className={`flex items-center justify-between p-3 rounded-xl border ${tierColors[tier.color]}`}>
                  <span className="text-sm font-medium">{tier.label}</span>
                  <span className="text-lg font-bold">{formatPYG(deliveryCost)}</span>
                </div>
              )}
              <div className="rounded-xl overflow-hidden border border-slate-800 text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-500 uppercase tracking-wider">
                      <th className="px-3 py-2 text-left font-semibold">Zona</th>
                      <th className="px-3 py-2 text-left font-semibold">Distancia</th>
                      <th className="px-3 py-2 text-right font-semibold">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      { zone: 'Zona 1', range: '0 – 2 km',   cost: 10_000, color: 'text-emerald-400' },
                      { zone: 'Zona 2', range: '2 – 7 km',   cost: 20_000, color: 'text-cyan-400'    },
                      { zone: 'Zona 3', range: '7 – 11 km',  cost: 25_000, color: 'text-amber-400'   },
                      { zone: 'Zona 4', range: '11 – 15 km', cost: 30_000, color: 'text-orange-400'  },
                      { zone: 'Zona 5', range: '> 14 km',    cost: null,   color: 'text-red-400'     },
                    ].map((row) => (
                      <tr key={row.zone} className="bg-slate-900/50 hover:bg-slate-800/30 transition-colors">
                        <td className={`px-3 py-2 font-semibold ${row.color}`}>{row.zone}</td>
                        <td className="px-3 py-2 text-slate-400">{row.range}</td>
                        <td className="px-3 py-2 text-right text-slate-300 font-medium">
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
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span className="text-base">📝</span> Observaciones (opcional)
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
            <div className="flex items-start justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl">T</div>
                  <div>
                    <p className="font-bold text-slate-100 text-lg leading-tight">Taita</p>
                    <p className="text-xs text-slate-500">tienda.taita.com.py</p>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-100 mt-2">PRESUPUESTO</p>
              </div>
              <div className="text-right text-sm text-slate-400 space-y-1">
                <p>Fecha: <span className="text-slate-200 font-medium">{todayLabel()}</span></p>
                {contact && (
                  <>
                    <p>Cliente: <span className="text-slate-200 font-medium">{contact.name}</span></p>
                    {contact.ruc    && <p>RUC: <span className="text-slate-200 font-medium">{contact.ruc}</span></p>}
                    {contact.phone1 && <p>Tel: <span className="text-slate-200 font-medium">{contact.phone1}</span></p>}
                    {contact.address && <p className="max-w-[200px] text-right">{contact.address}</p>}
                  </>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left font-semibold">Producto</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Cant.</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Precio unit.</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Subtotal</th>
                    <th className="px-4 py-2.5 text-center font-semibold no-print">⚙</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-200">
                        <p className="font-medium">{it.product.name}</p>
                        <p className="text-xs text-slate-500">{it.product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" min="1" className="w-16 text-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 no-print"
                          value={it.qty} onChange={(e) => updateItemQty(idx, e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" min="0" className="w-28 text-right bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 no-print"
                          value={it.unitPrice} onChange={(e) => updateItemPrice(idx, e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-200">
                        {formatPYG(it.qty * it.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors" title="Eliminar">
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
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal productos</span>
                  <span className="font-medium text-slate-200">{formatPYG(subtotal)}</span>
                </div>
                {withDelivery && (
                  <div className={`flex justify-between rounded-lg px-3 py-2 border ${tier ? tierColors[tier.color] : 'border-slate-700'}`}>
                    <span className="flex items-center gap-1.5">
                      🚚 Delivery
                      {distance && <span className="text-xs opacity-70">({parseFloat(distance).toFixed(1)} km)</span>}
                    </span>
                    <span className="font-semibold">{formatPYG(deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="font-bold text-slate-100 text-base">TOTAL</span>
                  <span className="font-extrabold text-brand-400 text-xl">{formatPYG(total)}</span>
                </div>
              </div>
            </div>

            {notes && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-400">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-slate-300">{notes}</p>
              </div>
            )}

            <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-800">
              Presupuesto válido por 48 hs · tienda.taita.com.py
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="card p-10 text-center text-slate-500 no-print">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Agregá productos para generar el presupuesto</p>
          </div>
        )}
      </div>
    </>
  );
}
