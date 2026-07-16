import { stockStatus } from '../../utils/formatters';

export default function StockBadge({ current, minimum }) {
  const status = stockStatus(current, minimum);
  return (
    <span className={status.className}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}
