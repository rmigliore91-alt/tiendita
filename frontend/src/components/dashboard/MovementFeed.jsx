import { formatDateTime, formatPYG } from '../../utils/formatters';

export default function MovementFeed({ movements = [] }) {
  if (!movements.length) {
    return (
      <div className="text-center py-12 text-body-sm text-on-surface-variant">
        <span className="material-symbol text-[36px] text-outline block mb-2">inventory_2</span>
        No hay movimientos recientes
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-container-high/60">
      {movements.map((m) => {
        const entrada = m.type === 'ENTRADA';
        return (
          <li key={m.id} className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-container-low transition-colors">
            <span
              className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                entrada ? 'bg-tertiary-fixed text-tertiary' : 'bg-error-container text-error'
              }`}
              aria-label={m.type}
            >
              <span className="material-symbol text-[18px]">{entrada ? 'south_west' : 'north_east'}</span>
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-label-lg text-on-surface truncate">{m.product_name}</p>
                <span className={`text-label-lg tabular-nums flex-shrink-0 ${entrada ? 'text-tertiary' : 'text-error'}`}>
                  {entrada ? '+' : '−'}{m.quantity} u.
                </span>
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant truncate tabular-nums">
                {formatPYG(m.total_price)} · {m.user_name}
              </p>
              <p className="text-label-sm text-outline mt-0.5 tabular-nums">{formatDateTime(m.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
