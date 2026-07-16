export function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colorMap = {
    blue:   { bg: 'bg-brand-500/10',   text: 'text-brand-400',   icon: 'text-brand-400' },
    green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400' },
    yellow: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: 'text-amber-400' },
    red:    { bg: 'bg-red-500/10',     text: 'text-red-400',     icon: 'text-red-400' },
    purple: { bg: 'bg-purple-500/10',  text: 'text-purple-400',  icon: 'text-purple-400' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${c.bg} flex-shrink-0`}>
        <span className={`text-xl ${c.icon}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  );
}
