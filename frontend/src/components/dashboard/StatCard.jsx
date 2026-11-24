import { Link } from 'react-router-dom';

// Tarjeta KPI — mismo lenguaje que las tarjetas del Portal Taita.
// `icon` es el nombre de un Material Symbol.
const TONES = {
  primary: { chip: 'bg-primary-fixed text-primary-container', value: 'text-on-surface' },
  success: { chip: 'bg-tertiary-fixed text-tertiary',         value: 'text-on-surface' },
  warning: { chip: 'bg-warning-container text-on-warning-container', value: 'text-on-surface' },
  error:   { chip: 'bg-error-container text-error',           value: 'text-on-surface' },
  brand:   { chip: 'bg-brand-soft text-brand-ink',            value: 'text-on-surface' },
};

export function StatCard({ icon, label, value, sub, tone = 'primary', to, className = '' }) {
  const t = TONES[tone] || TONES.primary;
  const Tag = to ? Link : 'div';

  return (
    <Tag
      to={to}
      className={`card p-5 flex flex-col justify-between gap-4 ${to ? 'hover:shadow-card-hover hover:border-outline-variant transition-all duration-150' : ''} ${className}`}
    >
      <span className={`w-9 h-9 rounded-full flex items-center justify-center ${t.chip}`}>
        <span className="material-symbol text-[20px]" aria-hidden="true">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className={`text-[28px] leading-9 font-bold tracking-tight tabular-nums truncate ${t.value}`}>{value}</p>
        <p className="text-label-md text-on-surface-variant mt-1">{label}</p>
        {sub && <p className="text-body-sm text-outline mt-0.5 truncate">{sub}</p>}
      </div>
    </Tag>
  );
}
