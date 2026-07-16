import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { StatCard } from '../components/dashboard/StatCard';
import MovementFeed from '../components/dashboard/MovementFeed';
import StockBadge from '../components/ui/StockBadge';
import { formatPYG } from '../utils/formatters';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, movRes] = await Promise.all([
          client.get('/products/dashboard-stats'),
          client.get('/movements/recent'),
        ]);
        setStats(statsRes.data.stats);
        setLowStock(statsRes.data.lowStockProducts);
        setMovements(movRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon="📦"
          label="Total Productos Activos"
          value={stats?.total_active ?? 0}
          color="blue"
        />
        <StatCard
          icon="✅"
          label="Stock OK"
          value={stats?.stock_ok ?? 0}
          color="green"
        />
        <StatCard
          icon="⚠️"
          label="Stock Bajo"
          value={stats?.stock_low ?? 0}
          color="yellow"
        />
        <StatCard
          icon="🚫"
          label="Sin Stock"
          value={stats?.stock_zero ?? 0}
          color="red"
        />
        <StatCard
          icon="💰"
          label="Valor Total Inventario"
          value={formatPYG(stats?.total_value ?? 0)}
          sub="stock × precio costo"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low stock alert table */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span className="text-amber-400">⚠</span> Alertas de Stock
            </h2>
            <Link to="/products?filter=low_stock" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Ver todos →
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm">Todos los productos tienen stock suficiente</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="text-right">Stock</th>
                    <th className="text-right">Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="text-slate-200 font-medium text-xs">{p.name}</p>
                          <p className="text-slate-600 text-xs">{p.sku}</p>
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs">{p.category_name}</td>
                      <td className="text-right font-semibold text-slate-200">{p.stock_current}</td>
                      <td className="text-right text-slate-400">{p.stock_minimum}</td>
                      <td>
                        <StockBadge current={p.stock_current} minimum={p.stock_minimum} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent movements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🔄</span> Últimos Movimientos
            </h2>
            <Link to="/history" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Ver historial →
            </Link>
          </div>
          <MovementFeed movements={movements} />
        </div>
      </div>
    </div>
  );
}
