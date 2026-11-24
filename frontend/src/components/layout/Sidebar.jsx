import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Íconos Material Symbols, igual que el Portal Taita (RRHH)
const navItems = [
  { to: '/',          icon: 'grid_view',      label: 'Resumen' },
  { to: '/products',  icon: 'inventory_2',    label: 'Productos' },
  { to: '/movements', icon: 'swap_vert',      label: 'Nuevo movimiento' },
  { to: '/history',   icon: 'history',        label: 'Historial' },
  { to: '/budget',    icon: 'request_quote',  label: 'Presupuesto' },
  { to: '/contacts',  icon: 'contacts',       label: 'Contactos' },
];

const adminItems = [
  { to: '/users', icon: 'manage_accounts', label: 'Usuarios' },
];

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg text-label-lg transition-colors ${
          isActive
            ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbol text-[20px] ${isActive ? 'filled' : ''}`} aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export function SidebarContent({ onNavigate }) {
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Marca */}
      <div className="h-16 px-4 flex items-center gap-2 border-b border-surface-container-high flex-shrink-0">
        <img src="/logo.png" alt="Taita" width={40} height={40} className="h-10 w-10 object-contain rounded-full" />
        <div className="flex flex-col">
          <span className="text-title-sm font-bold text-on-surface tracking-tight leading-tight">La Tiendita</span>
          <span className="text-label-sm text-on-surface-variant leading-tight">Gestión de stock</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto" aria-label="Menú principal">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        {isAdmin && (
          <>
            <p className="pt-5 pb-1.5 px-4 text-label-sm font-semibold text-outline uppercase tracking-wider">
              Administración
            </p>
            {adminItems.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      {/* Pie */}
      <div className="px-4 py-3 border-t border-surface-container-high flex items-center gap-2 text-label-sm text-outline">
        <span className="material-symbol text-[16px]" aria-hidden="true">language</span>
        tienda.taita.com.py
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }) {
  return (
    <>
      {/* Escritorio: barra fija */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-container-lowest shadow-sidebar border-r border-surface-container-high h-full flex-shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Móvil: cajón deslizable */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-surface-container-lowest shadow-modal transition-transform duration-200 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
