import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { StatCard } from '../components/dashboard/StatCard';
import MovementFeed from '../components/dashboard/MovementFeed';
import StockBadge from '../components/ui/StockBadge';
import { formatPYG } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

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
  if (days < 0) return <span className="badge-red"><span className="w-1.5 h-1.5 rounded-full bg-error-dot" />Vencido</span>;
  if (days <= 7) {
    return (
      <span className="badge bg-caution-container text-on-caution-container">
        <span className="w-1.5 h-1.5 rounded-full bg-caution" />Vence en {days} d
      </span>
    );
  }
  return <span className="badge-yellow"><span className="w-1.5 h-1.5 rounded-full bg-warning" />Vence en {days} d</span>;
}

function SectionHeader({ icon, tone, title, to, linkLabel }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-container-high">
      <h2 className="text-title-sm text-on-surface flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${tone}`}>
          <span className="material-symbol text-[18px]" aria-hidden="true">{icon}</span>
        </span>
        {title}
      </h2>
      <Link to={to} className="inline-flex items-center gap-0.5 text-label-md text-primary-container hover:text-primary transition-colors">
        {linkLabel}
        <span className="material-symbol text-[16px]" aria-hidden="true">arrow_forward</span>
      </Link>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const { user } = useAuth();
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
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const expiredCount   = parseInt(stats?.expired   ?? 0);
  const expiringSoonCount = parseInt(stats?.expiring_soon ?? 0);
  const hasExpiryAlerts = expiringProducts.length > 0;

  const firstName = user?.name?.split(' ')[0];
  const today = new Date().toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label-md text-outline uppercase tracking-wider first-letter:uppercase">{today}</p>
          <h2 className="page-title mt-1">{greeting()}{firstName ? `, ${firstName}` : ''}</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Así está el inventario de la tiendita hoy.</p>
        </div>
        <Link to="/movements" className="btn-primary">
          <span className="material-symbol text-[18px]" aria-hidden="true">add</span>
          Registrar movimiento
        </Link>
      </div>

      {/* Valor de inventario + KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="col-span-2 rounded-xl bg-primary text-on-primary p-6 flex flex-col justify-between gap-6 shadow-btn-primary relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary-container/70" aria-hidden="true" />
          <div className="absolute right-6 bottom-6 w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
          <div className="relative flex items-center gap-2 text-label-md uppercase tracking-wider text-primary-fixed-dim">
            <span className="material-symbol text-[18px]" aria-hidden="true">account_balance_wallet</span>
            Valor del inventario
          </div>
          <div className="relative">
            <p className="text-[32px] leading-10 font-bold tracking-tight tabular-nums">{formatPYG(stats?.total_value ?? 0)}</p>
            <p className="text-body-sm text-primary-fixed-dim mt-1">Stock actual × precio de costo</p>
          </div>
        </div>
        <StatCard icon="inventory_2" label="Productos activos" value={stats?.total_active ?? 0} tone="primary" />
        <StatCard icon="check_circle" label="Stock OK" value={stats?.stock_ok ?? 0} tone="success" />
        <StatCard icon="warning" label="Stock bajo" value={stats?.stock_low ?? 0} tone="warning" />
        <StatCard icon="remove_shopping_cart" label="Sin stock" value={stats?.stock_zero ?? 0} tone="error" />
      </div>

      {/* Aviso de vencimientos */}
      {hasExpiryAlerts && (
        <div className="p-4 rounded-xl border border-error-outline bg-error-container flex items-start gap-3" role="alert">
          <span className="material-symbol text-[22px] text-error flex-shrink-0" aria-hidden="true">event_busy</span>
          <div>
            <p className="text-label-lg text-on-error-container">Hay productos vencidos o por vencer</p>
            <p className="text-body-sm text-on-error-container/80 mt-0.5">
              {expiredCount > 0 && `${expiredCount} vencido${expiredCount !== 1 ? 's' : ''}`}
              {expiredCount > 0 && expiringSoonCount > 0 && ' · '}
              {expiringSoonCount > 0 && `${expiringSoonCount} vence${expiringSoonCount !== 1 ? 'n' : ''} en los próximos 30 días`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Alertas de stock */}
        <section className="card xl:col-span-3 overflow-hidden">
          <SectionHeader icon="warning" tone="bg-warning-container text-on-warning-container" title="Alertas de stock" to="/products" linkLabel="Ver productos" />
          {lowStock.length === 0 ? (
            <div className="text-center py-12 text-body-sm text-on-surface-variant">
              <span className="material-symbol text-[36px] text-success block mb-2">task_alt</span>
              Todos los productos tienen stock suficiente
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <p className="text-label-lg text-on-surface">{p.name}</p>
                        <p className="text-label-sm text-outline">{p.sku}</p>
                      </td>
                      <td className="text-on-surface-variant">{p.category_name}</td>
                      <td className="text-right font-semibold">{p.stock_current}</td>
                      <td className="text-right text-on-surface-variant">{p.stock_minimum}</td>
                      <td><StockBadge current={p.stock_current} minimum={p.stock_minimum} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Últimos movimientos */}
        <section className="card xl:col-span-2 overflow-hidden">
          <SectionHeader icon="swap_vert" tone="bg-primary-fixed text-primary-container" title="Últimos movimientos" to="/history" linkLabel="Ver historial" />
          <div className="px-5 py-2">
            <MovementFeed movements={movements} />
          </div>
        </section>
      </div>

      {/* Vencimientos */}
      {hasExpiryAlerts && (
        <section className="card overflow-hidden">
          <SectionHeader icon="event_busy" tone="bg-error-container text-error" title="Vencimientos" to="/products" linkLabel="Ver productos" />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-right">Stock</th>
                  <th>Vence</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {expiringProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <p className="text-label-lg text-on-surface">{p.name}</p>
                      <p className="text-label-sm text-outline">{p.sku}</p>
                    </td>
                    <td className="text-on-surface-variant">{p.category_name}</td>
                    <td className="text-right font-semibold">{p.stock_current}</td>
                    <td className="text-on-surface-variant">
                      {new Date(p.expiry_date + 'T00:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td><ExpiryBadge days={daysUntilExpiry(p.expiry_date)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
