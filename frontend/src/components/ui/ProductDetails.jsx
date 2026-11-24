/**
 * Compact chips for a product's specific characteristics
 * (e.g. Talle: M · Unidades: 20). Renders nothing when there are none.
 */
export default function ProductDetails({ details, className = '' }) {
  if (!Array.isArray(details) || details.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {details.map((d, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 text-[11px] leading-4 px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant"
        >
          <span className="font-medium">{d.label}:</span>
          <span className="text-on-surface">{d.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Plain-text version for one-line contexts (dropdown options, selects). */
export function detailsText(details) {
  if (!Array.isArray(details) || details.length === 0) return '';
  return details.map((d) => `${d.label}: ${d.value}`).join(' · ');
}
