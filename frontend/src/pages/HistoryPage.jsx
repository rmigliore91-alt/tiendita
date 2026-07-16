import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import Pagination from '../components/ui/Pagination';
import { formatPYG, formatDateTime } from '../utils/formatters';

export default function HistoryPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    product_id: '',
    category_id: '',
    type: '',
    sale_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);

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
        products.length ? Promise.resolve({ data: products }) : client.get('/products?page=1&limit=500'),
        users.length ? Promise.resolve({ data: users }) : client.get('/users').catch(() => ({ data: [] })),
      ]);
      setData(movRes.data.data);
      setPagination(movRes.data.pagination);
      setCategories(catRes.data);
      setProducts(prodRes.data.data ?? prodRes.data);  // handle both formats
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-100">Historial de Movimientos</h2>
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

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select className="form-input" value={filters.category_id} onChange={(e) => handleFilter('category_id', e.target.value)} id="hist-filter-category">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="form-input" value={filters.product_id} onChange={(e) => handleFilter('product_id', e.target.value)} id="hist-filter-product">
            <option value="">Todos los productos</option>
            {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
          </select>

          <select className="form-input" value={filters.type} onChange={(e) => handleFilter('type', e.target.value)} id="hist-filter-type">
            <option value="">Todos los tipos</option>
            <option value="ENTRADA">ENTRADA</option>
            <option value="SALIDA">SALIDA</option>
          </select>

          <select className="form-input" value={filters.sale_type} onChange={(e) => handleFilter('sale_type', e.target.value)} id="hist-filter-sale-type">
            <option value="">Todos los destinos</option>
            <option value="interna">🏠 Interna (Residentes)</option>
            <option value="externa">🌐 Externa (Ajenos/Colaboradores)</option>
          </select>

          <select className="form-input" value={filters.user_id} onChange={(e) => handleFilter('user_id', e.target.value)} id="hist-filter-user">
            <option value="">Todos los usuarios</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha desde</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              onChange={(e) => handleFilter('date_from', e.target.value)}
              id="hist-filter-date-from"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha hasta</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={(e) => handleFilter('date_to', e.target.value)}
              id="hist-filter-date-to"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={clearFilters} className="btn-secondary text-xs py-1.5">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Table */}
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
                      No se encontraron movimientos con los filtros seleccionados
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
