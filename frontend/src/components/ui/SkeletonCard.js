export default function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-7 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-8 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}
