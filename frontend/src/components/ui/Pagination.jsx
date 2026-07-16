export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-slate-400">
      <span>
        Mostrando {from}–{to} de {total} registros
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Primera página"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          let p;
          if (pages <= 7) {
            p = i + 1;
          } else if (page <= 4) {
            p = i + 1;
          } else if (page >= pages - 3) {
            p = pages - 6 + i;
          } else {
            p = page - 3 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página siguiente"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={() => onPageChange(pages)}
          disabled={page === pages}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
