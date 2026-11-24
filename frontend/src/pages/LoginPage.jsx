import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Panel de marca (escritorio) */}
      <aside className="hidden lg:flex w-[44%] max-w-xl relative overflow-hidden bg-primary text-on-primary flex-col justify-between p-12">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-primary-container/60" aria-hidden="true" />
        <div className="absolute -left-16 bottom-10 w-56 h-56 rounded-full bg-brand/90" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="Taita" width={48} height={48} className="h-12 w-12 rounded-full bg-surface-container-lowest object-contain" />
          <div>
            <p className="text-title-sm font-bold leading-tight">Taita</p>
            <p className="text-label-sm text-primary-fixed-dim leading-tight">Espacios de vida</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-[40px] leading-[48px] font-bold tracking-tight">La Tiendita</h1>
          <p className="text-body-md text-primary-fixed-dim mt-3 max-w-sm">
            Inventario, movimientos y presupuestos de productos geriátricos, en un solo lugar.
          </p>
        </div>

        <p className="relative text-label-sm text-primary-fixed-dim">tienda.taita.com.py</p>
      </aside>

      {/* Formulario */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <img src="/logo.png" alt="Taita" width={64} height={64} className="h-16 w-16 rounded-full object-contain mb-4" />
            <h1 className="text-headline-md text-on-surface tracking-tight">La Tiendita</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Gestión de stock · Taita</p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="page-title">Ingresar</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Usá tu cuenta de Taita para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="usuario@taita.com.py"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-label-md text-on-surface mb-1.5" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-container text-body-sm text-on-error-container flex items-start gap-2" role="alert">
                <span className="material-symbol text-[18px] text-error flex-shrink-0" aria-hidden="true">error</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2" id="btn-login">
              {loading ? (
                <>
                  <span className="material-symbol text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-label-sm text-outline mt-10">
            © {new Date().getFullYear()} Taita Espacios de Vida
          </p>
        </div>
      </main>
    </div>
  );
}
