const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  accepted:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  packed:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  shipped:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  // legacy
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const STATUS_ICONS = {
  pending: '🕐', accepted: '✅', packed: '📦',
  shipped: '🚚', delivered: '🎉', cancelled: '❌', confirmed: '✅',
};

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`badge capitalize text-xs ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {STATUS_ICONS[status] || ''} {status}
    </span>
  );
}
