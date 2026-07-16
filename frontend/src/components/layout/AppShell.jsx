import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/products':   'Productos',
  '/movements':  'Registrar Movimiento',
  '/history':    'Historial de Movimientos',
  '/users':      'Gestión de Usuarios',
};

export default function AppShell() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Taita Stock';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
