import { useTranslation } from 'react-i18next';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  return (
    <span className={`badge capitalize ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {t(`order.${status}`) || status}
    </span>
  );
}
