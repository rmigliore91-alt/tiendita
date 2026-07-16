import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/products',
    label: 'Productos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    to: '/movements',
    label: 'Registrar Movimiento',
    operatorOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'Historial',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/budget',
    label: 'Presupuesto',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/contacts',
    label: 'Contactos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const adminItems = [
  {
    to: '/users',
    label: 'Usuarios',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { isAdmin, isMarketing } = useAuth();

  // Filter nav items based on role
  const visibleNavItems = navItems.filter((item) => {
    if (item.operatorOnly && isMarketing) return false;
    return true;
  });

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-slate-900 border-r border-slate-800 h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Taita</p>
            <p className="text-xs text-slate-500">Gestión de Stock</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Administración</p>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-600 text-center">tienda.taita.com.py</p>
      </div>
    </aside>
  );
}
