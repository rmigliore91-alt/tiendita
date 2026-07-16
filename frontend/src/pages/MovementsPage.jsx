import { useEffect, useState } from 'react';
import client from '../api/client';
import { formatPYG } from '../utils/formatters';

export default function MovementsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    type: 'ENTRADA',
    sale_type: '',    // 'interna' | 'externa' — only for SALIDA
    quantity: '',
    unit_price: '',
    notes: '',
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // limit=500 → returns paginated format; use .data.data for the array
    client.get('/products?active=true&page=1&limit=500').then((res) => setProducts(res.data.data));
  }, []);

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset sale_type when switching to ENTRADA
      if (field === 'type' && value === 'ENTRADA') next.sale_type = '';
      return next;
    });
    if (field === 'product_id') {
      const p = products.find((p) => p.id === parseInt(value));
      setSelectedProduct(p || null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await client.post('/movements', {
        product_id: parseInt(form.product_id),
        type: form.type,
        sale_type: form.type === 'SALIDA' ? form.sale_type : undefined,
        quantity: parseInt(form.quantity),
        unit_price: parseInt(form.unit_price) || 0,
        notes: form.notes,
      });
      const destLabel = form.type === 'SALIDA'
        ? (form.sale_type === 'interna' ? ' — Interna (Residentes)' : ' — Externa (Ajenos/Colaboradores)')
        : '';
      setSuccess(`Movimiento registrado correctamente — ${form.type} de ${form.quantity} unidades${destLabel}`);
      // Refresh product list to get updated stock
      const res = await client.get('/products?active=true&page=1&limit=500');
      setProducts(res.data.data);
      const updated = res.data.data.find((p) => p.id === parseInt(form.product_id));
      setSelectedProduct(updated || null);
      setForm((prev) => ({ ...prev, sale_type: '', quantity: '', unit_price: '', notes: '' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  }

  const estimatedTotal =
    parseInt(form.quantity || 0) * parseInt(form.unit_price || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-slate-100">Registrar Movimiento de Stock</h2>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5" id="movement-form">
          {/* Product selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Producto *
            </label>
            <select
              className="form-input"
              value={form.product_id}
              onChange={(e) => handleChange('product_id', e.target.value)}
              required
              id="movement-product"
            >
              <option value="">Seleccionar producto…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} — Stock: {p.stock_current} {p.unit}
                </option>
              ))}
            </select>
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

          {/* Movement type toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Tipo de Movimiento *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('type', 'ENTRADA')}
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
                onClick={() => handleChange('type', 'SALIDA')}
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

          {/* Sale type — only visible for SALIDA */}
          {form.type === 'SALIDA' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Destino de Venta *
              </label>
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
                type="number"
                min="1"
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
                type="number"
                min="0"
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
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              !form.product_id ||
              !form.quantity ||
              (form.type === 'SALIDA' && !form.sale_type)
            }
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
      </div>
    </div>
  );
}
