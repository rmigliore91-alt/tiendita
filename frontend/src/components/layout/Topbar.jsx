import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-slate-200">{title}</h1>

      <div className="flex items-center gap-3">
        {/* User badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-400">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-200 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin ? 'Administrador' : 'Operador'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-800" />

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800"
          title="Cerrar sesión"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
