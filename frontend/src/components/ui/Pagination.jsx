function NavButton({ onClick, disabled, title, icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <span className="material-symbol text-[20px]">{icon}</span>
    </button>
  );
}

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-3 text-body-sm text-on-surface-variant">
      <span className="tabular-nums">
        Mostrando <span className="font-semibold text-on-surface">{from}–{to}</span> de {total} registros
      </span>
      <div className="flex items-center gap-1">
        <NavButton onClick={() => onPageChange(1)} disabled={page === 1} title="Primera página" icon="first_page" />
        <NavButton onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Página anterior" icon="chevron_left" />

        {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
          let p;
          if (pages <= 7) p = i + 1;
          else if (page <= 4) p = i + 1;
          else if (page >= pages - 3) p = pages - 6 + i;
          else p = page - 3 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`w-9 h-9 rounded-lg text-label-md tabular-nums transition-colors ${
                p === page
                  ? 'bg-primary-container text-on-primary shadow-btn-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {p}
            </button>
          );
        })}

        <NavButton onClick={() => onPageChange(page + 1)} disabled={page === pages} title="Página siguiente" icon="chevron_right" />
        <NavButton onClick={() => onPageChange(pages)} disabled={page === pages} title="Última página" icon="last_page" />
      </div>
    </div>
  );
}
