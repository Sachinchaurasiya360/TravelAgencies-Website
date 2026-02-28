export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Skeleton header */}
      <div className="animate-pulse">
        <div className="h-8 w-64 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-96 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Skeleton cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 p-6 dark:border-gray-700"
          >
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Skeleton table rows */}
      <div className="animate-pulse space-y-3">
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 w-full rounded bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}
