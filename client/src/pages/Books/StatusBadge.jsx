import { STATUS_LABELS } from './constants';

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
