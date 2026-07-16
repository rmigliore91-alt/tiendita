import { formatDateTime, formatPYG } from '../../utils/formatters';

export default function MovementFeed({ movements = [] }) {
  if (!movements.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-4xl mb-2">📦</p>
        <p>No hay movimientos recientes</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-800">
      {movements.map((m) => (
        <li key={m.id} className="flex items-start gap-3 py-3 hover:bg-slate-800/30 px-2 -mx-2 rounded-lg transition-colors">
          {/* Type indicator */}
          <div
            className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              m.type === 'ENTRADA'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {m.type === 'ENTRADA' ? '↑' : '↓'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-200 truncate">{m.product_name}</p>
              <span className={`text-xs font-semibold flex-shrink-0 ${
                m.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {m.type === 'ENTRADA' ? '+' : '-'}{m.quantity} u.
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>{m.type}</span>
              <span>·</span>
              <span>{formatPYG(m.total_price)}</span>
              <span>·</span>
              <span>{m.user_name}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{formatDateTime(m.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
