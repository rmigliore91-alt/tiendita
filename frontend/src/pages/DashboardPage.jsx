import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { StatCard } from '../components/dashboard/StatCard';
import MovementFeed from '../components/dashboard/MovementFeed';
import StockBadge from '../components/ui/StockBadge';
import { formatPYG } from '../utils/formatters';

/** Returns days until expiry (negative = already expired). */
function daysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate + 'T00:00:00');
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp - today) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days }) {
  if (days === null) return null;
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
        🔴 VENCIDO
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
        🟠 Vence en {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
      🟡 Vence en {days}d
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
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
        setExpiringProducts(statsRes.data.expiringProducts || []);
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

  const expiredCount   = parseInt(stats?.expired   ?? 0);
  const expiringSoonCount = parseInt(stats?.expiring_soon ?? 0);
  const hasExpiryAlerts = expiringProducts.length > 0;

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

      {/* Expiry alert banner — only shown when there are issues */}
      {hasExpiryAlerts && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">⏰</span>
          <div>
            <p className="text-sm font-bold text-red-300 mb-0.5">
              Alerta de Vencimiento
            </p>
            <p className="text-xs text-slate-400">
              {expiredCount > 0 && (
                <span className="text-red-400 font-semibold">{expiredCount} producto{expiredCount !== 1 ? 's' : ''} vencido{expiredCount !== 1 ? 's' : ''}</span>
              )}
              {expiredCount > 0 && expiringSoonCount > 0 && ' · '}
              {expiringSoonCount > 0 && (
                <span className="text-amber-400 font-semibold">{expiringSoonCount} próximo{expiringSoonCount !== 1 ? 's' : ''} a vencer (≤30 días)</span>
              )}
            </p>
          </div>
        </div>
      )}

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

      {/* Expiry alerts table — shown below if there are expiring products */}
      {hasExpiryAlerts && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span className="text-red-400">⏰</span> Alertas de Vencimiento
            </h2>
            <Link to="/products" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Ver productos →
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Fecha Vencimiento</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {expiringProducts.map((p) => {
                  const days = daysUntilExpiry(p.expiry_date);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="text-slate-200 font-medium text-xs">{p.name}</p>
                          <p className="text-slate-600 text-xs">{p.sku}</p>
                        </div>
                      </td>
                      <td className="text-slate-400 text-xs">{p.category_name}</td>
                      <td className="text-right font-semibold text-slate-200">{p.stock_current}</td>
                      <td className="text-center text-xs text-slate-400">
                        {new Date(p.expiry_date + 'T00:00:00').toLocaleDateString('es-PY', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </td>
                      <td className="text-center">
                        <ExpiryBadge days={days} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
