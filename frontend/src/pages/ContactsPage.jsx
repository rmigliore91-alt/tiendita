import { useEffect, useRef, useState, useCallback } from 'react';
import client from '../api/client';
import { formatPYG, formatDateTime } from '../utils/formatters';

/* ─── Field definitions ─────────────────────────────────────── */
const EMPTY_FORM = {
  name: '', ruc: '', email: '', phone1: '', phone2: '', address: '', notes: '',
};

/* ─── Small reusable field ──────────────────────────────────── */
function Field({ label, value, onChange, id, type = 'text', required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ─── Contact form modal ────────────────────────────────────── */
function ContactModal({ contact, onClose, onSaved }) {
  const [form, setForm] = useState(contact ? { ...contact } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field) { return (val) => setForm((p) => ({ ...p, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (contact) {
        const res = await client.put(`/contacts/${contact.id}`, form);
        onSaved(res.data);
      } else {
        const res = await client.post('/contacts', form);
        onSaved(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el contacto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-100">
            {contact ? '✏️ Editar contacto' : '➕ Nuevo contacto'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nombre / Razón social" value={form.name}    onChange={set('name')}    id="cf-name"    required placeholder="Ej. Juan Pérez" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="RUC"      value={form.ruc}    onChange={set('ruc')}    id="cf-ruc"    placeholder="80012345-6" />
            <Field label="E-mail"   value={form.email}  onChange={set('email')}  id="cf-email"  type="email" placeholder="cliente@mail.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono 1" value={form.phone1} onChange={set('phone1')} id="cf-phone1" placeholder="0981 123 456" />
            <Field label="Teléfono 2" value={form.phone2} onChange={set('phone2')} id="cf-phone2" placeholder="021 123 456" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Dirección</label>
            <textarea
              className="form-input resize-none"
              rows={2}
              placeholder="Calle, número, barrio, ciudad"
              value={form.address}
              onChange={(e) => set('address')(e.target.value)}
              id="cf-address"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Notas internas</label>
            <textarea
              className="form-input resize-none"
              rows={2}
              placeholder="Observaciones sobre el cliente…"
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              id="cf-notes"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Budget history item ────────────────────────────────────── */
function BudgetRow({ budget }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{formatDateTime(budget.created_at)}</span>
          {budget.with_delivery && (
            <span className="badge badge-blue">🚚 Delivery</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-brand-400 text-sm">{formatPYG(budget.total)}</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-800 px-4 py-3 space-y-2 bg-slate-900/50">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider">
                <th className="text-left pb-1.5 font-semibold">Producto</th>
                <th className="text-center pb-1.5 font-semibold">Cant.</th>
                <th className="text-right pb-1.5 font-semibold">P. Unit.</th>
                <th className="text-right pb-1.5 font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {budget.items?.map((it, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-1.5">{it.product_name}</td>
                  <td className="py-1.5 text-center">{it.quantity}</td>
                  <td className="py-1.5 text-right">{formatPYG(it.unit_price)}</td>
                  <td className="py-1.5 text-right font-medium">{formatPYG(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-end gap-1 pt-2 border-t border-slate-800 text-sm">
            <div className="flex justify-between w-48 text-slate-400">
              <span>Subtotal</span>
              <span>{formatPYG(budget.subtotal)}</span>
            </div>
            {budget.with_delivery && (
              <div className="flex justify-between w-48 text-cyan-400">
                <span>Delivery ({budget.distance_km} km)</span>
                <span>{formatPYG(budget.delivery_cost)}</span>
              </div>
            )}
            <div className="flex justify-between w-48 font-bold text-slate-100 border-t border-slate-700 pt-1">
              <span>Total</span>
              <span>{formatPYG(budget.total)}</span>
            </div>
          </div>
          {budget.notes && (
            <p className="text-xs text-slate-500 italic">{budget.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Contact detail drawer ─────────────────────────────────── */
function ContactDrawer({ contact, onClose, onEdit, onDelete }) {
  const [history, setHistory]   = useState([]);
  const [hTotal, setHTotal]     = useState(0);
  const [hLoading, setHLoading] = useState(true);
  const [hPage, setHPage]       = useState(1);
  const [hPages, setHPages]     = useState(1);

  const loadHistory = useCallback(async (page = 1) => {
    setHLoading(true);
    try {
      const res = await client.get(`/contacts/${contact.id}/history?page=${page}&limit=10`);
      setHistory(res.data.data);
      setHTotal(res.data.total);
      setHPages(res.data.totalPages);
      setHPage(page);
    } finally {
      setHLoading(false);
    }
  }, [contact.id]);

  useEffect(() => { loadHistory(1); }, [loadHistory]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <p className="text-xl font-bold text-slate-100">{contact.name}</p>
            {contact.ruc && <p className="text-xs text-slate-500 mt-0.5">RUC: {contact.ruc}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(contact)} className="btn-secondary px-3 py-1.5 text-xs">✏️ Editar</button>
            <button onClick={() => onDelete(contact)} className="btn-danger px-3 py-1.5 text-xs">🗑</button>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-4 border-b border-slate-800 grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: '📧', label: 'Email',      val: contact.email   },
            { icon: '📞', label: 'Teléfono 1', val: contact.phone1  },
            { icon: '📱', label: 'Teléfono 2', val: contact.phone2  },
            { icon: '📍', label: 'Dirección',  val: contact.address, full: true },
            { icon: '📝', label: 'Notas',      val: contact.notes,  full: true },
          ].filter((f) => f.val).map((f) => (
            <div key={f.label} className={f.full ? 'col-span-2' : ''}>
              <p className="text-xs text-slate-500 mb-0.5">{f.icon} {f.label}</p>
              <p className="text-slate-300">{f.val}</p>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="px-6 py-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-200 text-sm">
              📋 Historial de presupuestos
            </p>
            <span className="text-xs text-slate-500">{hTotal} en total</span>
          </div>

          {hLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">
              Sin presupuestos registrados aún
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((b) => <BudgetRow key={b.id} budget={b} />)}

              {hPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-3">
                  <button
                    onClick={() => loadHistory(hPage - 1)}
                    disabled={hPage <= 1}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >← Ant</button>
                  <span className="text-xs text-slate-500">{hPage} / {hPages}</span>
                  <button
                    onClick={() => loadHistory(hPage + 1)}
                    disabled={hPage >= hPages}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >Sig →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function ContactsPage() {
  const [contacts, setContacts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  const [modal, setModal]         = useState(null); // null | 'create' | contact obj
  const [drawer, setDrawer]       = useState(null); // contact obj | null
  const [delConfirm, setDelConfirm] = useState(null);

  const searchTimer = useRef(null);

  const load = useCallback(async (q = search, p = page) => {
    setLoading(true);
    try {
      const res = await client.get(`/contacts?active=true&page=${p}&limit=20&search=${encodeURIComponent(q)}`);
      setContacts(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(search, page); }, []); // eslint-disable-line

  function handleSearch(val) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(val, 1);
    }, 300);
  }

  function handleSaved(saved) {
    // refresh & update drawer if open
    load(search, page);
    if (drawer?.id === saved.id) setDrawer(saved);
  }

  async function handleDelete(contact) {
    try {
      await client.delete(`/contacts/${contact.id}`);
      setDelConfirm(null);
      setDrawer(null);
      load(search, page);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">👥 Contactos</h2>
        <button
          onClick={() => setModal('create')}
          className="btn-primary"
          id="btn-new-contact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo contacto
        </button>
      </div>

      {/* Search bar */}
      <div className="card p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="form-input pl-9"
            placeholder="Buscar por nombre, RUC o teléfono…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            id="contacts-search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">👤</div>
            <p>{search ? 'Sin resultados para la búsqueda' : 'No hay contactos aún'}</p>
            {!search && (
              <button onClick={() => setModal('create')} className="btn-primary mt-4 mx-auto">
                Crear primer contacto
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Nombre / Razón social</th>
                  <th>RUC</th>
                  <th>Teléfono</th>
                  <th>E-mail</th>
                  <th>Dirección</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setDrawer(c)}
                  >
                    <td className="font-medium text-slate-200">{c.name}</td>
                    <td className="text-slate-400">{c.ruc || '—'}</td>
                    <td className="text-slate-400">{c.phone1 || '—'}</td>
                    <td className="text-slate-400">{c.email || '—'}</td>
                    <td className="text-slate-400 max-w-[160px] truncate">{c.address || '—'}</td>
                    <td className="text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal(c); }}
                        className="text-slate-500 hover:text-brand-400 transition-colors p-1"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-sm text-slate-500">
                <span>{total} contactos</span>
                <div className="flex gap-2">
                  <button onClick={() => { setPage(page - 1); load(search, page - 1); }} disabled={page <= 1} className="btn-secondary px-3 py-1.5 text-xs">← Ant</button>
                  <span className="px-3 py-1.5">{page} / {pages}</span>
                  <button onClick={() => { setPage(page + 1); load(search, page + 1); }} disabled={page >= pages} className="btn-secondary px-3 py-1.5 text-xs">Sig →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <ContactModal
          contact={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Detail drawer */}
      {drawer && (
        <ContactDrawer
          contact={drawer}
          onClose={() => setDrawer(null)}
          onEdit={(c) => { setModal(c); }}
          onDelete={(c) => setDelConfirm(c)}
        />
      )}

      {/* Delete confirmation */}
      {delConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <p className="font-bold text-slate-100">¿Eliminar contacto?</p>
            <p className="text-sm text-slate-400">
              Se eliminará <span className="text-slate-200 font-medium">{delConfirm.name}</span>.
              Si tiene presupuestos registrados, se desactivará en lugar de eliminarse.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(delConfirm)} className="btn-danger flex-1 justify-center">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
