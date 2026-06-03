export default function StatCard({ icon, label, value, color = 'green', trend }) {
  const colorMap = {
    green: 'bg-green-50 dark:bg-green-900/20 text-paddy-green',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && <p className="text-xs text-green-600 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
