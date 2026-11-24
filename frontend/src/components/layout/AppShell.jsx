import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PAGE_TITLES = {
  '/':          'Resumen',
  '/products':  'Productos',
  '/movements': 'Registrar movimiento',
  '/history':   'Historial',
  '/budget':    'Presupuesto',
  '/contacts':  'Contactos',
  '/users':     'Usuarios',
};

export default function AppShell() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'La Tiendita';
  const [menuOpen, setMenuOpen] = useState(false);

  // Cierra el cajón móvil al cambiar de página o con Escape
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div key={location.pathname} className="page-enter max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
