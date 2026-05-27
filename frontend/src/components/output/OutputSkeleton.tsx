export function OutputSkeleton() {
  return (
    <div className="mx-auto max-w-[720px] animate-pulse rounded-2xl bg-white p-10">
      <div className="mx-auto h-6 w-3/4 rounded bg-gray-200" />
      <div className="mx-auto mt-3 h-4 w-1/2 rounded bg-gray-100" />
      <div className="mt-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${90 - i * 5}%` }} />
        ))}
      </div>
    </div>
  );
}
