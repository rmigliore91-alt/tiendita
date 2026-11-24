import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, onMenu }) {
  const { user, logout, isAdmin, isMarketing } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';
  const rol = isAdmin ? 'Administrador' : isMarketing ? 'Marketing' : 'Operador';

  return (
    <header className="sticky top-0 z-30 h-16 px-4 lg:px-8 flex items-center justify-between gap-4 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenu}
          className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Abrir menú"
        >
          <span className="material-symbol text-[22px]">menu</span>
        </button>
        <img src="/logo.png" alt="" width={32} height={32} className="lg:hidden h-8 w-8 rounded-full object-contain" />
        <p className="text-label-md text-outline uppercase tracking-wider truncate hidden sm:block">{title}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <p className="text-label-lg text-on-surface leading-tight">{user?.name}</p>
            <p className="text-label-sm text-on-surface-variant leading-tight mt-0.5">{rol}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-inverse-surface text-brand flex items-center justify-center text-label-md font-bold ring-2 ring-primary/20">
            {initials}
          </div>
        </div>

        <div className="w-px h-6 bg-surface-container-high" />

        <button
          onClick={logout}
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-label-md text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
          title="Cerrar sesión"
        >
          <span className="material-symbol text-[18px]">logout</span>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
