export function Loader() {
  return (
    <div className="flex gap-2" role="status" aria-label="Loading">
      <span
        className="size-3 animate-pulse rounded-full bg-indigo-600"
        aria-hidden="true"
      ></span>
      <span
        className="size-3 animate-pulse rounded-full bg-indigo-600 [animation-delay:0.2s]"
        aria-hidden="true"
      ></span>
      <span
        className="size-3 animate-pulse rounded-full bg-indigo-600 [animation-delay:0.4s]"
        aria-hidden="true"
      ></span>
    </div>
  );
}
